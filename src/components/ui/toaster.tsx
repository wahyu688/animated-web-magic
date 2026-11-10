import { CircleCheck, CircleX, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

const icons = {
  default: { Icon: CircleCheck, className: "text-success" },
  success: { Icon: CircleCheck, className: "text-success" },
  info: { Icon: Info, className: "text-info" },
  destructive: { Icon: CircleX, className: "text-destructive" },
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const { Icon, className } = icons[variant ?? "default"];
        return (
          <Toast key={id} variant={variant} {...props}>
            <Icon className={`mt-px h-[18px] w-[18px] shrink-0 ${className}`} strokeWidth={1.75} aria-hidden="true" />
            <div className="grid min-w-0 flex-1 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
