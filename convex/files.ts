import { MutationCtx, QueryCtx, mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { getUser } from './users';
import { fileTypes } from './schema';

/**
 * @description
 */
export const generateUploadUrl = mutation(async (ctx) => {
  // ログインしていなければ、エラー
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError('you must be logged in to upload a file');
  }

  return await ctx.storage.generateUploadUrl();
});
/**
 * @description ユーザーが組織に属しているかどうか判定
 */
export const hasAccessToOrg = async (
  ctx: QueryCtx | MutationCtx,
  tokenIdentifier: string,
  orgId: string
) => {
  // 違うユーザーであれば、エラー
  const user = await getUser(ctx, tokenIdentifier);
  const hasAccess =
    user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId);

  if (!hasAccess) {
    return null;
  }

  return user;
};

/**
 * @description ファイルを新規作成する
 */
export const createFile = mutation({
  args: {
    name: v.string(),
    fileId: v.id('_storage'),
    type: fileTypes,
    orgId: v.string(),
  },
  async handler(ctx, args) {
    // ログインしていなければ、エラー
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('you must be logged in to upload a file');
    }

    // ユーザーが指定した組織に属していなければ、エラー
    const user = await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      args.orgId
    );
    if (!user) {
      throw new ConvexError('you do not have access to this org');
    }

    await ctx.db.insert('files', {
      name: args.name,
      fileId: args.fileId,
      type: args.type,
      orgId: args.orgId,
      userId: user._id,
    });
  },
});
/**
 * @description ファイル一覧を取得する
 */
export const getFiles = query({
  args: {
    orgId: v.string(),
    query: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
  },
  async handler(ctx, args) {
    // ログインしていなければ、空で返す
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // ユーザーが指定した組織に属していなければ、エラー、空で返す
    const hasAccess = await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      args.orgId
    );
    if (!hasAccess) {
      return [];
    }

    const files = await ctx.db
      .query('files')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect();
    let filesWithUrl = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.fileId),
      }))
    );
    console.log('======[getFiles]filesWithUrl=======', filesWithUrl);

    // ワード検索でフィルター
    const query = args.query;
    if (query) {
      filesWithUrl = filesWithUrl.filter(({ name }) =>
        name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      );
    }

    // お気に入りでフィルター
    if (args.isFavorite) {
      //　ユーザーが存在しなければ、エラー
      const user = await ctx.db
        .query('users')
        .withIndex('by_tokenIdentifier', (q) =>
          q.eq('tokenIdentifier', identity.tokenIdentifier)
        )
        .first();
      if (!user) {
        throw new ConvexError('no user found');
      }

      const favorites = await ctx.db
        .query('favorites')
        .withIndex('by_userId_orgId_fileId', (q) =>
          q.eq('userId', user._id).eq('orgId', args.orgId)
        )
        .collect();
      filesWithUrl = filesWithUrl.filter((file) =>
        favorites.some((favorite) => favorite.fileId === file._id)
      );
    }

    return filesWithUrl;
  },
});
/**
 * @description
 */
export const deleteFile = mutation({
  args: {
    fileId: v.id('files'),
  },
  async handler(ctx, args) {
    // ログインしていなければ、エラー
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('you must be logged in to upload a file');
    }

    // ファイルが存在していなければ、エラー
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError('this file does not exist');
    }

    // ユーザーが指定した組織に属していなければ、エラー
    const hasAccess = await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      file.orgId
    );
    if (!hasAccess) {
      throw new ConvexError('you do not have access to this org');
    }

    await ctx.db.delete(args.fileId);
  },
});

/**
 * @description
 */
export const toggleFavorite = mutation({
  args: {
    fileId: v.id('files'),
  },
  async handler(ctx, args) {
    // ログインしていなければ、エラー
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('you must be logged in to upload a file');
    }

    // ファイルが存在していなければ、エラー
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError('this file does not exist');
    }

    // ユーザーが指定した組織に属していなければ、エラー
    const hasAccess = await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      file.orgId
    );
    if (!hasAccess) {
      throw new ConvexError('you do not have access to this org');
    }

    //　ユーザーが存在しなければ、エラー
    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier)
      )
      .first();
    if (!user) {
      throw new ConvexError('no user found');
    }

    const favorite = await ctx.db
      .query('favorites')
      .withIndex('by_userId_orgId_fileId', (q) =>
        q.eq('userId', user._id).eq('orgId', file.orgId).eq('fileId', file._id)
      )
      .first();
    if (!favorite) {
      // お気に入りを新規登録
      await ctx.db.insert('favorites', {
        fileId: file._id,
        userId: user._id,
        orgId: file.orgId,
      });
    } else {
      // お気に入りを削除
      await ctx.db.delete(favorite._id);
    }
  },
});
