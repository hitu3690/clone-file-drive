'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useOrganization, useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Doc } from '../../convex/_generated/dataModel';

const formSchema = z.object({
  title: z.string().min(0).max(200),
  file: z
    .custom<FileList>((val) => val instanceof FileList, 'Required')
    .refine((files) => files.length > 0, `Required`),
});

export const UploadButton = () => {
  const { toast } = useToast();
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // organization > userの優先度で、IDを取得
  const orgId: string | undefined =
    organization.isLoaded && user.isLoaded
      ? organization.organization?.id ?? user.user?.id
      : undefined;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      file: undefined,
    },
  });
  const fileRef = form.register('file');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('======[home page]values=======', values);
    if (!orgId) return;

    const postUrl = await generateUploadUrl();
    const fileType = values.file[0].type;
    const result = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': fileType },
      body: values.file[0],
    });
    const { storageId } = await result.json();

    const types = {
      'image/png': 'image',
      'application/pdf': 'pdf',
      'text/csv': 'csv',
    } as Record<string, Doc<'files'>['type']>;

    try {
      await createFile({
        name: values.title,
        fileId: storageId,
        type: types[fileType],
        orgId,
      });

      form.reset();
      setIsFileDialogOpen(false);
      toast({
        variant: 'success',
        title: 'File Upload',
        description: 'Now everyone can view your file',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Your file cloud not be uploaded, try again later',
      });
    }
  };

  // ダイアログの表示フラグ
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const createFile = useMutation(api.files.createFile);

  return (
    <Dialog
      open={isFileDialogOpen}
      onOpenChange={(isOpen) => {
        setIsFileDialogOpen(isOpen);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Upload File</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-8">Upload File your file here</DialogTitle>
          <DialogDescription>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="file"
                  render={() => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input type="file" {...fileRef} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="flex gap-1"
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Submit
                </Button>
              </form>
            </Form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
