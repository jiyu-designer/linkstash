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
            className="h-12 px-4 rounded-xl text-white font-medium transition-all duration-200 flex items-center justify-center glass-button border border-white/20 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-auto w-full"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-3"></div>
                <span className="text-sm font-medium">Analyzing</span>
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium tracking-wide">{buttonText}</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 