import { Button } from '@documenso/ui/primitives/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@documenso/ui/primitives/dialog';
import { Trans } from '@lingui/react/macro';
import { Undo2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { createCallable } from 'react-call';

export type SignFieldImageAnnotationDialogProps = {
  fieldMeta?: {
    backgroundImage?: string | null;
  } | null;
};

export const SignFieldImageAnnotationDialog = createCallable<SignFieldImageAnnotationDialogProps, string | null>(
  ({ call, fieldMeta }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lines, setLines] = useState<{ x: number; y: number }[][]>([]);
    const [currentLine, setCurrentLine] = useState<{ x: number; y: number }[]>([]);

    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const redrawCanvas = (allLines: { x: number; y: number }[][], current: { x: number; y: number }[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (fieldMeta?.backgroundImage) {
        const img = new Image();
        img.src = fieldMeta.backgroundImage;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      [...allLines, current].forEach((line) => {
        if (line.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        for (let i = 1; i < line.length; i++) {
          ctx.lineTo(line[i].x, line[i].y);
        }
        ctx.stroke();
      });
    };

    const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      const point = getCanvasPoint(e);
      setCurrentLine([point]);
    };

    const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const point = getCanvasPoint(e);
      const updated = [...currentLine, point];
      setCurrentLine(updated);
      redrawCanvas(lines, updated);
    };

    const onMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      if (currentLine.length > 0) {
        const newLines = [...lines, currentLine];
        setLines(newLines);
        setCurrentLine([]);
        redrawCanvas(newLines, []);
      }
    };

    const onUndoClick = () => {
      const newLines = lines.slice(0, -1);
      setLines(newLines);
      setCurrentLine([]);
      redrawCanvas(newLines, []);
    };

    const onClearClick = () => {
      setLines([]);
      setCurrentLine([]);
      redrawCanvas([], []);
    };

    const onConfirm = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      call.end(canvas.toDataURL());
    };

    return (
      <Dialog open={true} onOpenChange={(value) => (!value ? call.end(null) : null)}>
        <DialogContent position="center" className="max-w-2xl">
          <div>
            <DialogHeader>
              <DialogTitle>
                <Trans>Mark on Picture</Trans>
              </DialogTitle>
            </DialogHeader>

            <div className="relative mt-4">
              <canvas
                ref={canvasRef}
                className="h-auto w-full rounded-lg border border-border"
                style={{ aspectRatio: '4 / 3', touchAction: 'none', cursor: 'crosshair' }}
                width={800}
                height={600}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />
              {!fieldMeta?.backgroundImage && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  <Trans>No background image provided</Trans>
                </div>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              {lines.length > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  onClick={onUndoClick}
                >
                  <Undo2 className="h-3 w-3" />
                  <Trans>Undo</Trans>
                </button>
              )}
              {lines.length > 0 && (
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  onClick={onClearClick}
                >
                  <Trans>Clear</Trans>
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => call.end(null)}>
              <Trans>Cancel</Trans>
            </Button>

            <Button type="button" onClick={onConfirm}>
              <Trans>Confirm</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
