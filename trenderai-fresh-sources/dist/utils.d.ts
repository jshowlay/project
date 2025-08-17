export declare const http: import("axios").AxiosInstance;
export declare function getJson<T>(url: string, config?: any): Promise<T>;
export declare function floorToMinute(d?: Date): Date;
export declare function safe<T>(fn: () => Promise<T>, label: string): Promise<T | null>;
//# sourceMappingURL=utils.d.ts.map