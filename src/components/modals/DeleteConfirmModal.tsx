import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  description?: string;
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Delete Item?",
  itemName,
  description,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-card rounded-2xl p-8 shadow-card-hover border border-border"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                >
                  <AlertTriangle className="h-8 w-8" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed px-4">
                    {description || (
                      <>
                        Are you sure you want to delete{" "}
                        {itemName && <span className="font-semibold text-foreground">'{itemName}'</span>}
                        ? This action cannot be undone and all associated data will be permanently removed.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold shadow-lg hover:opacity-90 transition-all"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
