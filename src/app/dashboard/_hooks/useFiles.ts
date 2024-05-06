import { Preloaded, usePreloadedQuery, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useEffect, useState } from 'react';

export const useFiles = (
  preloadFiles: Preloaded<typeof api.files.getFiles>
) => {
  // TODO:
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const rawFiles = usePreloadedQuery(preloadFiles);
  const [files, setFiles] = useState(rawFiles); // 初回時にはrawFilesはデータが渡ってきていないが、型を固定するため代入

  useEffect(() => {
    let filteredFiles = rawFiles;

    // ワード検索でフィルター
    if (query) {
      filteredFiles = rawFiles.filter(({ name }) =>
        name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      );
    }

    // ファイルタイプでフィルター
    if (type !== 'all') {
      filteredFiles = rawFiles.filter((file) => file.type === type);
    }

    // 初回データ取得とフィルタリングでの取得どちらにも対応
    setFiles(filteredFiles);
  }, [query, rawFiles, type]);

  return {
    files,
    query,
    setQuery,
    type,
    setType,
    isLoading,
  };
};
