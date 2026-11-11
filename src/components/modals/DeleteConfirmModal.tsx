import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  description?: string;
  confirmLabel?: string;
}

/** "Modal/Confirm" from the design: destructive action with the item named up front. */
export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Delete Item?",
  itemName,
  description,
  confirmLabel = "Delete",
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-[420px] gap-0 p-6 [&>button:last-child]:hidden">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-destructive-soft text-destructive">
          <Trash2 className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <DialogTitle className="text-[20px] font-semibold leading-7 tracking-[-0.01em]">{title}</DialogTitle>
        <DialogDescription className="mt-1.5 text-small">
          {itemName && <b className="font-semibold text-foreground">{itemName}</b>}
          {itemName && " — "}
          {description ?? "This can't be undone."}
        </DialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
