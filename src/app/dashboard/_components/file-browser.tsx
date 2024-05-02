'use client';

import { useOrganization, useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { UploadButton } from '@/app/dashboard/_components/upload-button';
import { FileCard } from '@/app/dashboard/_components/file-card';
import Image from 'next/image';
import { GridIcon, Loader2, RowsIcon } from 'lucide-react';
import { SearchBar } from '@/app/dashboard/_components/search-bar';
import { useState } from 'react';
import { DataTable } from '@/app/dashboard/_components/file-table';
import { columns } from './columns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Placeholder = () => {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-24">
      <Image
        alt="an image of a picture and directory icon"
        width="300"
        height="300"
        src="/empty.svg"
      />
      <div className="text-2xl">You have no files, upload one now</div>
      <UploadButton />
    </div>
  );
};

export const FileBrowser = ({
  title,
  isFavorite,
}: {
  title: string;
  isFavorite?: boolean;
}) => {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  // organization > userの優先度で、IDを取得
  const orgId: string | undefined =
    organization.isLoaded && user.isLoaded
      ? organization.organization?.id ?? user.user?.id
      : undefined;

  const files = useQuery(
    api.files.getFiles,
    orgId ? { orgId, type, query, isFavorite } : 'skip'
  );

  const isLoading = files === undefined;

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{title}</h1>
        <SearchBar query={query} setQuery={setQuery} />
        <UploadButton />
      </div>

      <Tabs defaultValue="grid">
        <div className="flex justify-between items-center">
          <TabsList className="mb-2">
            <TabsTrigger value="grid" className="flex gap-2 items-center">
              <GridIcon />
              Grid
            </TabsTrigger>
            <TabsTrigger value="table" className="flex gap-2 items-center">
              <RowsIcon /> Table
            </TabsTrigger>
          </TabsList>
          <div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* レンダリング中 */}
        {isLoading && (
          <div className="flex flex-col gap-8 w-full items-center mt-24">
            <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
            <div className="text-2xl">Loading Your Images...</div>
          </div>
        )}
        {/* レンダリング後 */}
        {!isLoading && (
          <>
            <TabsContent value="grid">
              <div className="grid grid-cols-3 gap-4">
                {files?.map((file) => <FileCard key={file._id} file={file} />)}
              </div>
            </TabsContent>
            <TabsContent value="table">
              <DataTable columns={columns} data={files} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {files?.length === 0 && <Placeholder />}
    </>
  );
};
