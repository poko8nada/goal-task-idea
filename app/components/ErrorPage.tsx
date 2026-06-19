import type { DataSourceError } from '@/lib/data/source';

interface ErrorPageProps {
  kind: DataSourceError['kind'];
}

const MESSAGE_BY_KIND: Record<DataSourceError['kind'], string> = {
  io: 'データの読み込みに失敗しました。ファイルが見つからないか、アクセス権限がありません。',
  parse: 'データファイルの形式が不正です。',
};

export function ErrorPage({ kind }: ErrorPageProps) {
  return (
    <div class='w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50'>
      <div class='max-w-md p-6 bg-white border border-red-200 rounded-lg shadow-sm'>
        <h1 class='text-lg font-semibold text-red-900 mb-2'>データの読み込みエラー</h1>
        <p class='text-sm text-gray-700 mb-3'>{MESSAGE_BY_KIND[kind]}</p>
        <p class='text-xs text-gray-400 font-mono'>error kind: {kind}</p>
      </div>
    </div>
  );
}
