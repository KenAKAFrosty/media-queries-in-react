export declare type StringToString = {
    [key: string]: string;
};
export declare type QueryLists = {
    [key: string]: MediaQueryList;
};
export declare type QueryMatches = {
    [key: string]: boolean;
};
export default function useMediaQueries<T extends StringToString>(queriesByFriendlyNames: T): {
    [Property in keyof T]: boolean;
};
