"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus } from "lucide-react";
import {
  PedidoForm,
  type ClienteOption,
  type ReceitaOption,
} from "@/app/pedidos/pedido-form";
import { Modal } from "@/components/modal";

type QuickPedidoDialogProps = {
  clientes: ClienteOption[];
  receitas: ReceitaOption[];
  fretePadrao: string;
};

export function QuickPedidoDialog({
  clientes,
  receitas,
  fretePadrao,
}: QuickPedidoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        <ClipboardPlus className="size-4" aria-hidden="true" />
        Novo pedido rápido
      </button>

      <Modal open={open} onClose={() => setOpen(false)} label="Novo pedido rápido">
        <PedidoForm
          clientes={clientes}
          receitas={receitas}
          fretePadrao={fretePadrao}
          permitirNovoCliente
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
