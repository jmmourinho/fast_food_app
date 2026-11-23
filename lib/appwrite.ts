import {Account, Avatars, Client, Databases, ID, Query, Storage} from "react-native-appwrite";
import {Category, CreateUserParams, GetMenuParams, MenuItem, SignInParams, User} from "../type";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    platform:"com.chris.foodapp",
    databaseId:'6b00ea250019200fb918',
    bucketId: '6b04943f00230bafbb7d',
    userCollectionId: '6b00eac7002bed11ce84',
    categoriesCollectionId: '6b048ba80020abb5f9c7',
    menuCollectionId: '6b048d0a000c2920c4e2',
    customizationsCollectionId: '6b049085000894a1b7ec',
    menuCustomizationsCollectionId: '6b04926c00006435368b'
}

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name)
        if(!newAccount) throw Error;

        await signIn({ email, password });

        const avatarUrl = avatars.getInitialsURL(name);

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            { email, name, accountId: newAccount.$id, avatar: avatarUrl }
        );
    } catch (e) {
        throw new Error(e as string);
    }
}

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const currentAccount = await account.get();
        if(!currentAccount) return null;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        )

        if(!currentUser || currentUser.documents.length === 0) return null;

        return currentUser.documents[0] as unknown as User;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export const getMenu = async ({ category, query, limit }: GetMenuParams): Promise<MenuItem[]> => {
    try {
        const queries: string[] = [];

        if(category && category !== 'all') queries.push(Query.equal('categories', category));
        if(query) queries.push(Query.search('name', query));
        if(limit) queries.push(Query.limit(limit));

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries,
        )

        return menus.documents as unknown as MenuItem[];
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getCategories = async (): Promise<Category[]> => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
        )

        return categories.documents as unknown as Category[];
    } catch (e) {
        throw new Error(e as string);
    }
}