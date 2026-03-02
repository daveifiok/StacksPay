interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
}

export default function AmountInput({ value, onChange, currency = 'BTC' }: AmountInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border rounded-lg pr-16"
        placeholder="0.00"
      />
      <span className="absolute right-3 top-3 text-gray-500">{currency}</span>
    </div>
  );
}
