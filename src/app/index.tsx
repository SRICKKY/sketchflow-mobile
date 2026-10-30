import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoardCard } from '@/components/board-card';
import { CreateBoardModal } from '@/components/create-board-modal';
import { ApiError, api } from '@/lib/api/client';
import type {
  BoardScope,
  BoardSummary,
  DashboardResponse,
} from '@/lib/api/types';
import { useAuth } from '@/providers/auth-provider';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Unable to load your boards. Check your connection and try again.';
}

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [scope, setScope] = useState<BoardScope>('owned');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const requestId = useRef(0);
  const loadingMore = useRef(false);
  const columns = width >= 1120 ? 3 : width >= 760 ? 2 : 1;

  useEffect(() => {
    let active = true;
    const initialRequest = ++requestId.current;
    Promise.all([api.getDashboard(), api.listBoards('owned', '', null)])
      .then(([dashboardResponse, boardPage]) => {
        if (!active) {
          return;
        }
        setDashboard(dashboardResponse);
        if (initialRequest === requestId.current) {
          setBoards(boardPage.items);
          setNextCursor(boardPage.nextCursor);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (active && initialRequest === requestId.current) {
          setLoadError(errorMessage(error));
        }
      })
      .finally(() => {
        if (active && initialRequest === requestId.current) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const loadBoards = async (
    nextScope: BoardScope,
    query: string,
    cursor: string | null = null,
    append = false,
  ) => {
    const currentRequest = ++requestId.current;
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setIsRefreshing(false);
      setLoadError(null);
      loadingMore.current = false;
    }

    try {
      const page = await api.listBoards(nextScope, query, cursor);
      if (currentRequest !== requestId.current) {
        return;
      }
      setBoards((previous) =>
        append ? [...previous, ...page.items] : page.items,
      );
      setNextCursor(page.nextCursor);
      setLoadError(null);
    } catch (error) {
      if (currentRequest === requestId.current) {
        setLoadError(errorMessage(error));
      }
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        loadingMore.current = false;
      }
    }
  };

  const changeScope = (nextScope: BoardScope) => {
    if (nextScope === scope) {
      return;
    }
    setScope(nextScope);
    setBoards([]);
    setNextCursor(null);
    void loadBoards(nextScope, appliedSearch);
  };

  const applySearch = () => {
    const query = search.trim();
    setAppliedSearch(query);
    setBoards([]);
    setNextCursor(null);
    void loadBoards(scope, query);
  };

  const refresh = async () => {
    const refreshRequest = ++requestId.current;
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const [dashboardResponse, boardPage] = await Promise.all([
        api.getDashboard(),
        api.listBoards(scope, appliedSearch),
      ]);
      if (refreshRequest !== requestId.current) {
        return;
      }
      setDashboard(dashboardResponse);
      setBoards(boardPage.items);
      setNextCursor(boardPage.nextCursor);
    } catch (error) {
      if (refreshRequest === requestId.current) {
        setLoadError(errorMessage(error));
      }
    } finally {
      if (refreshRequest === requestId.current) {
        setIsRefreshing(false);
      }
    }
  };

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore || loadingMore.current) {
      return;
    }
    loadingMore.current = true;
    await loadBoards(scope, appliedSearch, nextCursor, true);
  };

  const createBoard = async (name: string) => {
    const board = await api.createBoard(name);
    requestId.current += 1;
    loadingMore.current = false;
    setScope('owned');
    setAppliedSearch('');
    setSearch('');
    setBoards((current) =>
      scope === 'owned' && !appliedSearch ? [board, ...current] : [board],
    );
    setIsCreateOpen(false);
    if (scope !== 'owned' || appliedSearch) {
      setNextCursor(null);
    }
    setIsLoading(false);
    setDashboard((current) =>
      current
        ? {
            ...current,
            capabilities: {
              ...current.capabilities,
              ownedBoards: current.capabilities.ownedBoards + 1,
            },
          }
        : current,
    );
  };

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(
        error instanceof ApiError
          ? error.message
          : 'Unable to sign out. Check your connection and try again.',
      );
    }
  };

  const displayName = user?.name?.trim() || user?.email.split('@')[0] || 'there';
  const canCreateBoard = dashboard?.capabilities.canCreateBoard ?? false;
  const maxBoards = dashboard?.capabilities.maxOwnedBoards;
  const ownedBoardCount = dashboard?.capabilities.ownedBoards ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        {width >= 1000 ? (
          <View style={styles.sidebar}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>S</Text>
              </View>
              <Text style={styles.brandName}>SketchFlow</Text>
            </View>
            <Text style={styles.sidebarLabel}>YOUR SPACE</Text>
            <Pressable
              onPress={() => changeScope('owned')}
              style={[
                styles.navItem,
                scope === 'owned' && styles.navItemActive,
              ]}
            >
              <Text style={styles.navIcon}>▦</Text>
              <Text
                style={[
                  styles.navText,
                  scope === 'owned' && styles.navTextActive,
                ]}
              >
                My boards
              </Text>
            </Pressable>
            <Pressable
              onPress={() => changeScope('shared')}
              style={[
                styles.navItem,
                scope === 'shared' && styles.navItemActive,
              ]}
            >
              <Text style={styles.navIcon}>↗</Text>
              <Text
                style={[
                  styles.navText,
                  scope === 'shared' && styles.navTextActive,
                ]}
              >
                Shared with me
              </Text>
            </Pressable>
            <View style={styles.sidebarBottom}>
              {canCreateBoard ? (
                <Pressable
                  onPress={() => setIsCreateOpen(true)}
                  style={styles.sidebarCreate}
                >
                  <Text style={styles.sidebarCreateText}>＋  New board</Text>
                </Pressable>
              ) : null}
              <View style={styles.sidebarProfile}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {displayName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text numberOfLines={1} style={styles.profileName}>
                    {displayName}
                  </Text>
                  <Text numberOfLines={1} style={styles.profileEmail}>
                    {user?.email}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Sign out"
                  onPress={() => void handleSignOut()}
                  style={styles.signOutIcon}
                >
                  <Text style={styles.signOutIconText}>↪</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.main}>
          <View style={styles.topbar}>
            {width < 1000 ? (
              <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>S</Text>
                </View>
                <Text style={styles.brandName}>SketchFlow</Text>
              </View>
            ) : (
              <Text style={styles.topbarHint}>Your ideas, all in one place</Text>
            )}
            <View style={styles.topbarActions}>
              {width < 1000 ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {displayName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => void handleSignOut()}
                style={styles.topbarSignOut}
              >
                <Text style={styles.topbarSignOutText}>Sign out</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                colors={['#5563dc']}
                onRefresh={() => void refresh()}
                refreshing={isRefreshing}
                tintColor="#5563dc"
              />
            }
          >
            <View style={styles.contentHeader}>
              <View style={styles.headingBlock}>
                <Text style={styles.eyebrow}>WORKSPACE</Text>
                <Text style={styles.heading}>
                  {scope === 'owned' ? 'Your boards' : 'Shared with you'}
                </Text>
                <Text style={styles.headingSubtitle}>
                  {scope === 'owned'
                    ? 'A home for every idea in progress.'
                    : 'Boards your teammates have shared with you.'}
                </Text>
              </View>
              <View style={styles.headerCreate}>
                {canCreateBoard && scope === 'owned' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setIsCreateOpen(true)}
                    style={styles.createButton}
                  >
                    <Text style={styles.createButtonText}>＋  New board</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {signOutError ? (
              <View accessibilityRole="alert" style={styles.inlineError}>
                <Text style={styles.inlineErrorText}>{signOutError}</Text>
              </View>
            ) : null}

            <View style={styles.toolbar}>
              {width < 1000 ? (
                <View style={styles.scopeTabs}>
                  <ScopeButton
                    active={scope === 'owned'}
                    label="My boards"
                    onPress={() => changeScope('owned')}
                  />
                  <ScopeButton
                    active={scope === 'shared'}
                    label="Shared with me"
                    onPress={() => changeScope('shared')}
                  />
                </View>
              ) : null}
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>⌕</Text>
                <TextInput
                  accessibilityLabel="Search boards"
                  onChangeText={setSearch}
                  onSubmitEditing={applySearch}
                  placeholder="Search boards"
                  placeholderTextColor="#98a2b3"
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={search}
                />
                {search !== appliedSearch ? (
                  <Pressable onPress={applySearch} style={styles.searchAction}>
                    <Text style={styles.searchActionText}>Search</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.boardCount}>
                {scope === 'owned' && maxBoards !== null && maxBoards !== undefined
                  ? `${ownedBoardCount} of ${maxBoards} boards`
                  : `${boards.length} ${boards.length === 1 ? 'board' : 'boards'}`}
              </Text>
            </View>

            {loadError ? (
              <View accessibilityRole="alert" style={styles.loadError}>
                <Text style={styles.loadErrorText}>{loadError}</Text>
                <Pressable onPress={() => void refresh()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : null}
            {isLoading && boards.length === 0 ? (
              <View style={styles.loading}>
                <ActivityIndicator color="#5563dc" size="large" />
                <Text style={styles.loadingText}>Loading your boards…</Text>
              </View>
            ) : null}
            {!isLoading && boards.length === 0 && !loadError ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>▦</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {appliedSearch
                    ? 'No boards match that search'
                    : scope === 'owned'
                      ? 'Your next big idea starts here'
                      : 'No shared boards yet'}
                </Text>
                <Text style={styles.emptyDescription}>
                  {appliedSearch
                    ? 'Try another name or clear the search.'
                    : scope === 'owned'
                      ? 'Create a board and give your ideas room to grow.'
                      : 'Boards shared with you will show up here.'}
                </Text>
                {scope === 'owned' && canCreateBoard && !appliedSearch ? (
                  <Pressable
                    onPress={() => setIsCreateOpen(true)}
                    style={styles.emptyButton}
                  >
                    <Text style={styles.emptyButtonText}>Create your first board</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {boards.length > 0 ? (
              <View style={styles.boardGrid}>
                {Array.from(
                  { length: Math.ceil(boards.length / columns) },
                  (_, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.boardRow}>
                      {boards
                        .slice(rowIndex * columns, (rowIndex + 1) * columns)
                        .map((board, columnIndex) => (
                          <BoardCard
                            board={board}
                            index={rowIndex * columns + columnIndex}
                            key={board.id}
                            onPress={() =>
                              router.push({
                                pathname: '/boards/[id]',
                                params: { id: board.id },
                              })
                            }
                          />
                        ))}
                      {columns > 1 &&
                      boards.slice(rowIndex * columns, (rowIndex + 1) * columns)
                        .length < columns
                        ? Array.from(
                            {
                              length:
                                columns -
                                boards.slice(
                                  rowIndex * columns,
                                  (rowIndex + 1) * columns,
                                ).length,
                            },
                            (_, emptyIndex) => (
                              <View
                                key={`empty-${rowIndex}-${emptyIndex}`}
                                style={styles.boardCardSpacer}
                              />
                            ),
                          )
                        : null}
                    </View>
                  ),
                )}
              </View>
            ) : null}
            {nextCursor ? (
              <Pressable
                disabled={isLoadingMore}
                onPress={() => void loadMore()}
                style={styles.loadMoreButton}
              >
                {isLoadingMore ? (
                  <ActivityIndicator color="#5563dc" />
                ) : (
                  <Text style={styles.loadMoreText}>Load more boards</Text>
                )}
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>

      <CreateBoardModal
        onClose={() => setIsCreateOpen(false)}
        onCreate={createBoard}
        visible={isCreateOpen}
      />
    </SafeAreaView>
  );
}

function ScopeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.scopeButton, active && styles.scopeButtonActive]}
    >
      <Text style={[styles.scopeText, active && styles.scopeTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8fc',
  },
  appShell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 244,
    borderRightWidth: 1,
    borderRightColor: '#e9ecf2',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#202b4a',
  },
  brandMarkText: {
    color: '#c9f27a',
    fontSize: 20,
    fontWeight: '900',
  },
  brandName: {
    marginLeft: 10,
    color: '#202b4a',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sidebarLabel: {
    marginTop: 42,
    marginBottom: 12,
    color: '#98a2b3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  navItem: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  navItemActive: {
    backgroundColor: '#f0f2ff',
  },
  navIcon: {
    width: 25,
    color: '#667085',
    fontSize: 17,
    fontWeight: '700',
  },
  navText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#4654c8',
    fontWeight: '700',
  },
  sidebarBottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sidebarCreate: {
    minHeight: 46,
    justifyContent: 'center',
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#202b4a',
    paddingHorizontal: 14,
  },
  sidebarCreateText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eef0f4',
    paddingTop: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#e9ecff',
  },
  avatarText: {
    color: '#4d5bd0',
    fontSize: 14,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },
  profileName: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '700',
  },
  profileEmail: {
    marginTop: 3,
    color: '#98a2b3',
    fontSize: 10,
  },
  signOutIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  signOutIconText: {
    color: '#667085',
    fontSize: 19,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  topbar: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecf2',
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
  },
  topbarHint: {
    color: '#667085',
    fontSize: 13,
  },
  topbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topbarSignOut: {
    marginLeft: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  topbarSignOutText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 36,
    marginBottom: 28,
  },
  headingBlock: {
    flex: 1,
  },
  eyebrow: {
    color: '#6975d5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  heading: {
    marginTop: 8,
    color: '#202b4a',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headingSubtitle: {
    marginTop: 8,
    color: '#667085',
    fontSize: 14,
  },
  headerCreate: {
    marginLeft: 16,
  },
  createButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#5563dc',
    paddingHorizontal: 18,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 20,
  },
  scopeTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  scopeButton: {
    minHeight: 38,
    justifyContent: 'center',
    marginRight: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  scopeButtonActive: {
    backgroundColor: '#eef0ff',
  },
  scopeText: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '600',
  },
  scopeTextActive: {
    color: '#4654c8',
    fontWeight: '700',
  },
  searchBox: {
    flex: 1,
    minWidth: 200,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5ed',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
    color: '#98a2b3',
    fontSize: 22,
    lineHeight: 25,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: '#344054',
    fontSize: 13,
  },
  searchAction: {
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
  searchActionText: {
    color: '#4d5bd0',
    fontSize: 12,
    fontWeight: '700',
  },
  boardCount: {
    marginLeft: 16,
    color: '#98a2b3',
    fontSize: 12,
  },
  boardRow: {
    gap: 16,
  },
  boardGrid: {
    gap: 16,
  },
  boardCardSpacer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 52,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#eef0ff',
  },
  emptyIconText: {
    color: '#5563dc',
    fontSize: 28,
  },
  emptyTitle: {
    marginTop: 18,
    color: '#202b4a',
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    maxWidth: 330,
    marginTop: 8,
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyButton: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#5563dc',
    paddingHorizontal: 17,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#667085',
    fontSize: 13,
  },
  loadError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecdca',
    borderRadius: 12,
    backgroundColor: '#fff6f5',
    padding: 14,
  },
  loadErrorText: {
    flex: 1,
    color: '#b42318',
    fontSize: 13,
  },
  retryText: {
    marginLeft: 12,
    color: '#9f1c13',
    fontSize: 13,
    fontWeight: '700',
  },
  loadMoreButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d9def7',
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  loadMoreText: {
    color: '#4d5bd0',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineError: {
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#fff6f5',
    padding: 12,
  },
  inlineErrorText: {
    color: '#b42318',
    fontSize: 13,
  },
});
