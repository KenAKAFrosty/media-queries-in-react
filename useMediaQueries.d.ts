declare type StringToString = {
    [key: string]: string;
};
export declare type QueryLists = {
    [key: string]: MediaQueryList;
};
export declare type QueriesMatches = {
    [key: string]: boolean;
};
export default function useMediaQueries<T extends StringToString>(queriesByFriendlyNames: T): {
    [Property in keyof T]: boolean;
};
declare module 'media-queries-in-react'
export {};
//# sourceMappingURL=useMediaQueries.d.ts.map