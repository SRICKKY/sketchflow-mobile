import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, api } from '@/lib/api/client';
import type { BoardDetail, CanvasElement } from '@/lib/api/types';

type ShapeTool = 'rectangle' | 'ellipse';
type CanvasTool = ShapeTool | 'select';
type Point = { x: number; y: number };

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Unable to load the board. Check your connection and try again.';
}

function operationId(): string {
  return `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createShape(
  type: ShapeTool,
  bounds: { x: number; y: number; width: number; height: number },
  zIndex: number,
): CanvasElement {
  const id = operationId();
  return {
    id,
    type,
    ...bounds,
    rotation: 0,
    strokeColor: '#5563dc',
    backgroundColor: type === 'rectangle' ? '#e9ecff' : '#e5f6ef',
    strokeWidth: 2,
    opacity: 1,
    fillStyle: 'solid',
    strokeStyle: 'solid',
    roughness: 1,
    seed: Math.floor(Math.random() * 1_000_000),
    groupId: null,
    frameId: null,
    zIndex,
    locked: false,
  };
}

export default function BoardEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [pendingElements, setPendingElements] = useState<CanvasElement[]>([]);
  const [revision, setRevision] = useState(0);
  const [tool, setTool] = useState<CanvasTool>('select');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [zIndex, setZIndex] = useState(0);
  const isEditable = board?.role !== 'VIEWER';
  const startPoint = useRef<Point | null>(null);

  const applyBoardDetail = useCallback((detail: BoardDetail) => {
    setBoard(detail);
    setElements(detail.elements);
    setRevision(detail.revision);
    setZIndex(
      detail.elements.reduce((highest, element) => Math.max(highest, element.zIndex), 0),
    );
    setPendingElements([]);
    setSaveMessage(null);
  }, []);

  useEffect(() => {
    let active = true;
    if (!id) {
      void Promise.resolve().then(() => {
        if (active) {
          setError('The board link is invalid.');
          setIsLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }

    void api
      .getBoardDetail(id)
      .then((detail) => {
        if (active) {
          applyBoardDetail(detail);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(messageFor(loadError));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applyBoardDetail, id]);

  const loadBoard = useCallback(async () => {
    if (!id) {
      setError('The board link is invalid.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      applyBoardDetail(await api.getBoardDetail(id));
    } catch (loadError) {
      setError(messageFor(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [applyBoardDetail, id]);

  const addShape = useCallback(
    (type: ShapeTool, start: Point, end: Point) => {
      if (isSaving || !isEditable || canvasSize.width === 0 || canvasSize.height === 0) {
        return;
      }

      const scaleX = CANVAS_WIDTH / canvasSize.width;
      const scaleY = CANVAS_HEIGHT / canvasSize.height;
      const startX = start.x * scaleX;
      const startY = start.y * scaleY;
      const endX = end.x * scaleX;
      const endY = end.y * scaleY;
      const width = Math.max(72, Math.abs(endX - startX));
      const height = Math.max(56, Math.abs(endY - startY));
      const x = Math.max(0, Math.min(CANVAS_WIDTH - width, Math.min(startX, endX)));
      const y = Math.max(0, Math.min(CANVAS_HEIGHT - height, Math.min(startY, endY)));
      const shape = createShape(type, { x, y, width, height }, zIndex + 1);

      setElements((current) => [...current, shape]);
      setPendingElements((current) => [...current, shape]);
      setZIndex((current) => current + 1);
      setSaveMessage('Unsaved changes');
    },
    [canvasSize.height, canvasSize.width, isEditable, isSaving, zIndex],
  );

  const handleCanvasRelease = useCallback(
    (event: {
      nativeEvent: { locationX: number; locationY: number };
    }) => {
      const start = startPoint.current;
      startPoint.current = null;
      if (!start || tool === 'select') {
        return;
      }
      addShape(tool, start, {
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      });
    },
    [addShape, tool],
  );

  const saveChanges = async () => {
    if (!id || pendingElements.length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await api.patchBoardElements(id, {
        baseRevision: revision,
        clientOperationId: operationId(),
        upserts: pendingElements,
        deletedIds: [],
      });
      setRevision(response.revision);
      setPendingElements([]);
      setSaveMessage('All changes saved');
    } catch (saveError) {
      setError(
        saveError instanceof ApiError && saveError.status === 409
          ? 'This board changed elsewhere. Reload the latest version before saving again.'
          : messageFor(saveError),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const canvasHeight = Math.max(360, Math.min(620, (width - 48) * 2 / 3));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹  Boards</Text>
        </Pressable>
        <View style={styles.boardHeading}>
          <Text numberOfLines={1} style={styles.boardName}>
            {board?.name ?? 'Board'}
          </Text>
          <Text style={styles.boardRole}>{board?.role ?? ' '}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!pendingElements.length || isSaving || !isEditable}
          onPress={() => void saveChanges()}
          style={[
            styles.saveButton,
            (!pendingElements.length || isSaving || !isEditable) && styles.buttonDisabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {pendingElements.length ? 'Save changes' : 'Saved'}
            </Text>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#5563dc" size="large" />
          <Text style={styles.stateText}>Opening your canvas…</Text>
        </View>
      ) : error && !board ? (
        <View style={styles.state}>
          <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadBoard()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.editor}>
          <View style={styles.toolbar}>
            <View style={styles.toolGroup}>
              <ToolButton
                active={tool === 'select'}
                label="Select"
                onPress={() => setTool('select')}
              />
              <ToolButton
                active={tool === 'rectangle'}
                disabled={!isEditable}
                label="Rectangle"
                onPress={() => setTool('rectangle')}
              />
              <ToolButton
                active={tool === 'ellipse'}
                disabled={!isEditable}
                label="Ellipse"
                onPress={() => setTool('ellipse')}
              />
            </View>
            <Text numberOfLines={1} style={styles.canvasHint}>
              {isEditable
                ? tool === 'select'
                  ? 'Choose a shape, then drag on the canvas'
                  : `Drag to draw a ${tool}`
                : 'You have view-only access'}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.canvasScroll}>
            <View
              onMoveShouldSetResponder={() => tool !== 'select' && isEditable && !isSaving}
              onLayout={(event) => setCanvasSize(event.nativeEvent.layout)}
              onResponderGrant={(event) => {
                startPoint.current = {
                  x: event.nativeEvent.locationX,
                  y: event.nativeEvent.locationY,
                };
              }}
              onResponderRelease={handleCanvasRelease}
              onResponderTerminate={() => {
                startPoint.current = null;
              }}
              onStartShouldSetResponder={() => tool !== 'select' && isEditable && !isSaving}
              style={[styles.canvas, { height: canvasHeight }]}
            >
              <View pointerEvents="none" style={styles.canvasGrid}>
                {sortedElements.map((element) => (
                  <CanvasItem
                    element={element}
                    key={element.id}
                    scaleX={canvasSize.width / CANVAS_WIDTH}
                    scaleY={canvasSize.height / CANVAS_HEIGHT}
                  />
                ))}
              </View>
              {tool !== 'select' && isEditable ? (
                <View pointerEvents="none" style={styles.drawingHint}>
                  <Text style={styles.drawingHintText}>Drag to place shape</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.statusGroup}>
              <View
                style={[
                  styles.statusDot,
                  pendingElements.length > 0 && styles.statusDotPending,
                ]}
              />
              <Text style={styles.statusText}>
                {saveMessage ?? `${elements.length} ${elements.length === 1 ? 'element' : 'elements'}`}
              </Text>
            </View>
            {error ? (
              <View style={styles.errorRow}>
                <Text accessibilityRole="alert" numberOfLines={2} style={styles.inlineError}>
                  {error}
                </Text>
                {error.includes('Reload') ? (
                  <Pressable onPress={() => void loadBoard()}>
                    <Text style={styles.reloadText}>Reload</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function ToolButton({
  active,
  disabled = false,
  label,
  onPress,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.toolButton,
        active && styles.toolButtonActive,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.toolText, active && styles.toolTextActive]}>{label}</Text>
    </Pressable>
  );
}

function CanvasItem({
  element,
  scaleX,
  scaleY,
}: {
  element: CanvasElement;
  scaleX: number;
  scaleY: number;
}) {
  const shapeStyle = {
    position: 'absolute' as const,
    left: element.x * scaleX,
    top: element.y * scaleY,
    width: Math.max(1, element.width * scaleX),
    height: Math.max(1, element.height * scaleY),
    borderWidth: Math.max(1, element.strokeWidth * scaleX),
    borderColor: element.strokeColor || '#344054',
    backgroundColor:
      element.fillStyle === 'none' ? 'transparent' : element.backgroundColor || 'transparent',
    opacity: element.opacity,
    transform: [{ rotate: `${(element.rotation * 180) / Math.PI}deg` }],
  };

  if (element.type === 'ellipse') {
    return <View style={[shapeStyle, styles.ellipse]} />;
  }
  if (element.type === 'text' || element.type === 'note') {
    return (
      <View style={[shapeStyle, styles.textShape]}>
        <Text numberOfLines={4} style={styles.canvasText}>
          {typeof element.text === 'string' ? element.text : ''}
        </Text>
      </View>
    );
  }
  return <View style={shapeStyle} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8fc',
  },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecf2',
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: 18,
  },
  backText: {
    color: '#5563dc',
    fontSize: 15,
    fontWeight: '700',
  },
  boardHeading: {
    flex: 1,
    minWidth: 0,
  },
  boardName: {
    color: '#202b4a',
    fontSize: 18,
    fontWeight: '800',
  },
  boardRole: {
    marginTop: 3,
    color: '#98a2b3',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveButton: {
    minWidth: 122,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderRadius: 12,
    backgroundColor: '#5563dc',
    paddingHorizontal: 14,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  stateText: {
    marginTop: 14,
    color: '#667085',
    fontSize: 15,
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: '#5563dc',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  editor: {
    flex: 1,
  },
  toolbar: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolButton: {
    minHeight: 40,
    justifyContent: 'center',
    marginRight: 7,
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 13,
  },
  toolButtonActive: {
    borderColor: '#c7cdfd',
    backgroundColor: '#f0f2ff',
  },
  toolText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '700',
  },
  toolTextActive: {
    color: '#4654c8',
  },
  canvasHint: {
    flex: 1,
    marginLeft: 12,
    color: '#98a2b3',
    fontSize: 12,
    textAlign: 'right',
  },
  canvasScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  canvas: {
    width: '100%',
    maxWidth: 1440,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  canvasGrid: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
  },
  ellipse: {
    borderRadius: 1000,
  },
  textShape: {
    justifyContent: 'center',
    padding: 6,
  },
  canvasText: {
    color: '#344054',
    fontSize: 12,
  },
  drawingHint: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(32,43,74,0.84)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  drawingHintText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e9ecf2',
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#12b76a',
  },
  statusDotPending: {
    backgroundColor: '#f79009',
  },
  statusText: {
    color: '#667085',
    fontSize: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 16,
  },
  inlineError: {
    flexShrink: 1,
    color: '#b42318',
    fontSize: 11,
    textAlign: 'right',
  },
  reloadText: {
    marginLeft: 10,
    color: '#5563dc',
    fontSize: 12,
    fontWeight: '700',
  },
});
