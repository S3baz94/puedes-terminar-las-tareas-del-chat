import { useState, FormEvent } from 'react';
import type { DonationFund } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { useToastStore } from '../../store/toastStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Toggle } from '../common/Toggle';
import { Gift, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

export function MemberDonationTab() {
  const { user } = useAuth();
  const donations = useAppStore((state) => state.donations);
  const addDonation = useAppStore((state) => state.addDonation);
  const notify = useToastStore((state) => state.notify);

  // Forms local state
  const [amount, setAmount] = useState('80000');
  const [fund, setFund] = useState<DonationFund>('offering');
  const [donationMessage, setDonationMessage] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);

  async function submitDonation(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(amount);

    if (!parsed || parsed < 5000) {
      setDonationMessage('El monto minimo es 5.000 COP.');
      return;
    }

    addDonation({
      userId: user?.uid ?? 'guest',
      amount: parsed,
      currency: 'COP',
      fund: fund,
      method: 'card',
      isRecurring: isRecurring,
    });

    setDonationMessage('¡Donación registrada con éxito!');
    notify({ title: 'Donacion registrada', description: `${formatCurrency(parsed)} COP`, tone: 'success' });
    setTimeout(() => setDonationMessage(null), 3000);
  }



  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card eyebrow="Stripe" title="Nueva donacion">
        <form className="space-y-4" onSubmit={submitDonation}>
          <Input
            label="Monto COP"
            min={5000}
            onChange={(event) => setAmount(event.currentTarget.value)}
            type="number"
            value={amount}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">Fondo</span>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
              onChange={(event) => setFund(event.currentTarget.value as DonationFund)}
              value={fund}
            >
              <option value="tithe">Diezmo</option>
              <option value="offering">Ofrenda</option>
              <option value="missions">Misiones</option>
              <option value="building">Construccion</option>
              <option value="social">Obra social</option>
            </select>
          </label>
          <Toggle checked={isRecurring} label="Donacion recurrente" onChange={setIsRecurring} />
          {donationMessage ? <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">{donationMessage}</p> : null}
          <Button className="w-full" icon={<Gift className="h-4 w-4" />} type="submit">
            Continuar pago
          </Button>
        </form>
      </Card>
      <Card eyebrow="Historial" title="Comprobantes">
        <div className="space-y-3">
          {donations.filter((d) => d.userId === user?.uid).map((donation) => (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3" key={donation.id}>
              <div>
                <p className="font-bold text-ink">{formatCurrency(donation.amount)}</p>
                <p className="text-sm text-muted">{donation.fund}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={true}
              >
                Próximamente
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
