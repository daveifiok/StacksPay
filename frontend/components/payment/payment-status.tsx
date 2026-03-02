interface PaymentStatusProps {
  status: 'pending' | 'completed' | 'failed';
}

export default function PaymentStatus({ status }: PaymentStatusProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${
        status === 'completed' ? 'bg-green-500' : 
        status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
      }`}></div>
      <span className="capitalize">{status}</span>
    </div>
  );
}
