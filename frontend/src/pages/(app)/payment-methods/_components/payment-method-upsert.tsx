"use client"

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { usePost, usePatch, authenticatedFetch } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface PaymentMethod {
  id: string;
  name: string;
  details?: string;
  type?: "BANK_TRANSFER" | "PAYPAL" | "CASH" | "CHECK" | "OTHER";
  isActive?: boolean;
}

interface PaymentMethodUpsertProps {
  paymentMethod?: PaymentMethod | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentMethodUpsert({ paymentMethod, open, onOpenChange }: PaymentMethodUpsertProps) {
  const { t } = useTranslation();
  const isEdit = !!paymentMethod;

  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [type, setType] = useState<PaymentMethod["type"]>("BANK_TRANSFER");

  const { trigger: createTrigger, loading: creating } = usePost("/api/payment-methods");
  const { trigger: updateTrigger, loading: updating } = usePatch(`/api/payment-methods/${paymentMethod?.id || ""}`);

  useEffect(() => {
    if (paymentMethod) {
      setName(paymentMethod.name || "");
      setDetails(paymentMethod.details || "");
      setType(paymentMethod.type || "BANK_TRANSFER");
    } else {
      setName("");
      setDetails("");
      setType("BANK_TRANSFER");
    }
  }, [paymentMethod, open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      toast.error(t("paymentMethods.messages.nameRequired") || "Name is required");
      return;
    }

    try {
      if (isEdit) {
        if (updateTrigger) {
          await updateTrigger({ name: name.trim(), details: details.trim(), type });
        } else {
          const res = await authenticatedFetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/payment-methods/${paymentMethod?.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), details: details.trim(), type }),
          });
          if (!res.ok) throw new Error("Update failed");
        }
        toast.success(t("paymentMethods.messages.updateSuccess") || "Payment method updated");
      } else {
        await createTrigger({ name: name.trim(), details: details.trim(), type });
        toast.success(t("paymentMethods.messages.addSuccess") || "Payment method added");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(
        isEdit
          ? t("paymentMethods.messages.updateError") || "Failed to update payment method"
          : t("paymentMethods.messages.addError") || "Failed to add payment method"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(`paymentMethods.upsert.title.${isEdit ? "edit" : "create"}`)}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pm-name">{t("paymentMethods.fields.name.label")}</Label>
            <Input id="pm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("paymentMethods.fields.name.placeholder") as string} />
          </div>

          <div>
            <Label htmlFor="pm-details">{t("paymentMethods.fields.details.label")}</Label>
            <Input id="pm-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("paymentMethods.fields.details.placeholder") as string} />
          </div>

          <div>
            <Label>{t("paymentMethods.fields.type.label")}</Label>
            <Select value={type} onValueChange={(val) => setType(val as any)}>
              <SelectTrigger className="w-full" size="sm" aria-label={t("paymentMethods.fields.type.label") as string}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">{t("paymentMethods.fields.type.bank_transfer")}</SelectItem>
                <SelectItem value="PAYPAL">{t("paymentMethods.fields.type.paypal")}</SelectItem>
                <SelectItem value="CHECK">{t("paymentMethods.fields.type.check")}</SelectItem>
                <SelectItem value="CASH">{t("paymentMethods.fields.type.cash")}</SelectItem>
                <SelectItem value="OTHER">{t("paymentMethods.fields.type.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              {t("paymentMethods.actions.cancel") || "Cancel"}
            </Button>
            <Button type="submit" disabled={creating || updating}>
              {isEdit ? t("paymentMethods.actions.save") || "Save" : t("paymentMethods.actions.add") || "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentMethodUpsert