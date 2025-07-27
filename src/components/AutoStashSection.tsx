import { Input } from '@/components/sds';

interface AutoStashSectionProps {
  url: string;
  memo: string;
  isLoading: boolean;
  error: string;
  onUrlChange: (value: string) => void;
  onMemoChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  buttonText?: string;
  placeholder?: string;
}

export default function AutoStashSection({
  url,
  memo,
  isLoading,
  error,
  onUrlChange,
  onMemoChange,
  onSubmit,
  buttonText = "AutoStash",
  placeholder = "Paste a link"
}: AutoStashSectionProps) {
  return (
    <div className="section-container p-8 mb-9">
      <form onSubmit={onSubmit}>
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full h-12 px-4 glass-input text-sm font-normal ${error ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {error && (
                <p className="text-red-400 text-xs mt-2 px-2">{error}</p>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <Input
              type="text"
              value={memo}
              onChange={(e) => onMemoChange(e.target.value)}
              placeholder="Personal memo (optional)"
              className="w-full h-12 px-4 glass-input text-sm font-normal"
              disabled={isLoading}
            />
          </div>
           
          <button
            type="submit"
            disabled={isLoading}
            className="smartsort-button h-12 px-8 rounded-xl text-white font-medium disabled:opacity-50 transition-all duration-200 lg:w-auto w-full"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-3"></div>
                <span className="text-sm font-medium">Analyzing</span>
              </span>
            ) : (
              <span className="text-sm font-medium tracking-wide">{buttonText}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 