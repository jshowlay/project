
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model TrendRecord
 * 
 */
export type TrendRecord = $Result.DefaultSelection<Prisma.$TrendRecordPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more TrendRecords
 * const trendRecords = await prisma.trendRecord.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more TrendRecords
   * const trendRecords = await prisma.trendRecord.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.trendRecord`: Exposes CRUD operations for the **TrendRecord** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TrendRecords
    * const trendRecords = await prisma.trendRecord.findMany()
    * ```
    */
  get trendRecord(): Prisma.TrendRecordDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.13.0
   * Query Engine version: 361e86d0ea4987e9f53a565309b3eed797a6bcbd
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    TrendRecord: 'TrendRecord'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    sqlite?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "trendRecord"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      TrendRecord: {
        payload: Prisma.$TrendRecordPayload<ExtArgs>
        fields: Prisma.TrendRecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TrendRecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TrendRecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>
          }
          findFirst: {
            args: Prisma.TrendRecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TrendRecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>
          }
          findMany: {
            args: Prisma.TrendRecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>[]
          }
          create: {
            args: Prisma.TrendRecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>
          }
          createMany: {
            args: Prisma.TrendRecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TrendRecordCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>[]
          }
          delete: {
            args: Prisma.TrendRecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>
          }
          update: {
            args: Prisma.TrendRecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>
          }
          deleteMany: {
            args: Prisma.TrendRecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TrendRecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TrendRecordUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>[]
          }
          upsert: {
            args: Prisma.TrendRecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrendRecordPayload>
          }
          aggregate: {
            args: Prisma.TrendRecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrendRecord>
          }
          groupBy: {
            args: Prisma.TrendRecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<TrendRecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.TrendRecordCountArgs<ExtArgs>
            result: $Utils.Optional<TrendRecordCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    trendRecord?: TrendRecordOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model TrendRecord
   */

  export type AggregateTrendRecord = {
    _count: TrendRecordCountAggregateOutputType | null
    _avg: TrendRecordAvgAggregateOutputType | null
    _sum: TrendRecordSumAggregateOutputType | null
    _min: TrendRecordMinAggregateOutputType | null
    _max: TrendRecordMaxAggregateOutputType | null
  }

  export type TrendRecordAvgAggregateOutputType = {
    score: number | null
    delta24h: number | null
  }

  export type TrendRecordSumAggregateOutputType = {
    score: number | null
    delta24h: number | null
  }

  export type TrendRecordMinAggregateOutputType = {
    id: string | null
    source: string | null
    topic: string | null
    score: number | null
    delta24h: number | null
    url: string | null
    region: string | null
    tags: string | null
    raw: string | null
    observedAt: Date | null
    language: string | null
    createdAt: Date | null
    observedBucket: Date | null
  }

  export type TrendRecordMaxAggregateOutputType = {
    id: string | null
    source: string | null
    topic: string | null
    score: number | null
    delta24h: number | null
    url: string | null
    region: string | null
    tags: string | null
    raw: string | null
    observedAt: Date | null
    language: string | null
    createdAt: Date | null
    observedBucket: Date | null
  }

  export type TrendRecordCountAggregateOutputType = {
    id: number
    source: number
    topic: number
    score: number
    delta24h: number
    url: number
    region: number
    tags: number
    raw: number
    observedAt: number
    language: number
    createdAt: number
    observedBucket: number
    _all: number
  }


  export type TrendRecordAvgAggregateInputType = {
    score?: true
    delta24h?: true
  }

  export type TrendRecordSumAggregateInputType = {
    score?: true
    delta24h?: true
  }

  export type TrendRecordMinAggregateInputType = {
    id?: true
    source?: true
    topic?: true
    score?: true
    delta24h?: true
    url?: true
    region?: true
    tags?: true
    raw?: true
    observedAt?: true
    language?: true
    createdAt?: true
    observedBucket?: true
  }

  export type TrendRecordMaxAggregateInputType = {
    id?: true
    source?: true
    topic?: true
    score?: true
    delta24h?: true
    url?: true
    region?: true
    tags?: true
    raw?: true
    observedAt?: true
    language?: true
    createdAt?: true
    observedBucket?: true
  }

  export type TrendRecordCountAggregateInputType = {
    id?: true
    source?: true
    topic?: true
    score?: true
    delta24h?: true
    url?: true
    region?: true
    tags?: true
    raw?: true
    observedAt?: true
    language?: true
    createdAt?: true
    observedBucket?: true
    _all?: true
  }

  export type TrendRecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrendRecord to aggregate.
     */
    where?: TrendRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrendRecords to fetch.
     */
    orderBy?: TrendRecordOrderByWithRelationInput | TrendRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TrendRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrendRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrendRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TrendRecords
    **/
    _count?: true | TrendRecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TrendRecordAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TrendRecordSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TrendRecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TrendRecordMaxAggregateInputType
  }

  export type GetTrendRecordAggregateType<T extends TrendRecordAggregateArgs> = {
        [P in keyof T & keyof AggregateTrendRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrendRecord[P]>
      : GetScalarType<T[P], AggregateTrendRecord[P]>
  }




  export type TrendRecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrendRecordWhereInput
    orderBy?: TrendRecordOrderByWithAggregationInput | TrendRecordOrderByWithAggregationInput[]
    by: TrendRecordScalarFieldEnum[] | TrendRecordScalarFieldEnum
    having?: TrendRecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TrendRecordCountAggregateInputType | true
    _avg?: TrendRecordAvgAggregateInputType
    _sum?: TrendRecordSumAggregateInputType
    _min?: TrendRecordMinAggregateInputType
    _max?: TrendRecordMaxAggregateInputType
  }

  export type TrendRecordGroupByOutputType = {
    id: string
    source: string
    topic: string
    score: number
    delta24h: number | null
    url: string | null
    region: string | null
    tags: string
    raw: string | null
    observedAt: Date
    language: string | null
    createdAt: Date
    observedBucket: Date | null
    _count: TrendRecordCountAggregateOutputType | null
    _avg: TrendRecordAvgAggregateOutputType | null
    _sum: TrendRecordSumAggregateOutputType | null
    _min: TrendRecordMinAggregateOutputType | null
    _max: TrendRecordMaxAggregateOutputType | null
  }

  type GetTrendRecordGroupByPayload<T extends TrendRecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TrendRecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TrendRecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TrendRecordGroupByOutputType[P]>
            : GetScalarType<T[P], TrendRecordGroupByOutputType[P]>
        }
      >
    >


  export type TrendRecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    topic?: boolean
    score?: boolean
    delta24h?: boolean
    url?: boolean
    region?: boolean
    tags?: boolean
    raw?: boolean
    observedAt?: boolean
    language?: boolean
    createdAt?: boolean
    observedBucket?: boolean
  }, ExtArgs["result"]["trendRecord"]>

  export type TrendRecordSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    topic?: boolean
    score?: boolean
    delta24h?: boolean
    url?: boolean
    region?: boolean
    tags?: boolean
    raw?: boolean
    observedAt?: boolean
    language?: boolean
    createdAt?: boolean
    observedBucket?: boolean
  }, ExtArgs["result"]["trendRecord"]>

  export type TrendRecordSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    topic?: boolean
    score?: boolean
    delta24h?: boolean
    url?: boolean
    region?: boolean
    tags?: boolean
    raw?: boolean
    observedAt?: boolean
    language?: boolean
    createdAt?: boolean
    observedBucket?: boolean
  }, ExtArgs["result"]["trendRecord"]>

  export type TrendRecordSelectScalar = {
    id?: boolean
    source?: boolean
    topic?: boolean
    score?: boolean
    delta24h?: boolean
    url?: boolean
    region?: boolean
    tags?: boolean
    raw?: boolean
    observedAt?: boolean
    language?: boolean
    createdAt?: boolean
    observedBucket?: boolean
  }

  export type TrendRecordOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "source" | "topic" | "score" | "delta24h" | "url" | "region" | "tags" | "raw" | "observedAt" | "language" | "createdAt" | "observedBucket", ExtArgs["result"]["trendRecord"]>

  export type $TrendRecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TrendRecord"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      source: string
      topic: string
      score: number
      delta24h: number | null
      url: string | null
      region: string | null
      tags: string
      raw: string | null
      observedAt: Date
      language: string | null
      createdAt: Date
      observedBucket: Date | null
    }, ExtArgs["result"]["trendRecord"]>
    composites: {}
  }

  type TrendRecordGetPayload<S extends boolean | null | undefined | TrendRecordDefaultArgs> = $Result.GetResult<Prisma.$TrendRecordPayload, S>

  type TrendRecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TrendRecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TrendRecordCountAggregateInputType | true
    }

  export interface TrendRecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TrendRecord'], meta: { name: 'TrendRecord' } }
    /**
     * Find zero or one TrendRecord that matches the filter.
     * @param {TrendRecordFindUniqueArgs} args - Arguments to find a TrendRecord
     * @example
     * // Get one TrendRecord
     * const trendRecord = await prisma.trendRecord.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TrendRecordFindUniqueArgs>(args: SelectSubset<T, TrendRecordFindUniqueArgs<ExtArgs>>): Prisma__TrendRecordClient<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TrendRecord that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TrendRecordFindUniqueOrThrowArgs} args - Arguments to find a TrendRecord
     * @example
     * // Get one TrendRecord
     * const trendRecord = await prisma.trendRecord.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TrendRecordFindUniqueOrThrowArgs>(args: SelectSubset<T, TrendRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TrendRecordClient<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TrendRecord that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrendRecordFindFirstArgs} args - Arguments to find a TrendRecord
     * @example
     * // Get one TrendRecord
     * const trendRecord = await prisma.trendRecord.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TrendRecordFindFirstArgs>(args?: SelectSubset<T, TrendRecordFindFirstArgs<ExtArgs>>): Prisma__TrendRecordClient<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TrendRecord that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrendRecordFindFirstOrThrowArgs} args - Arguments to find a TrendRecord
     * @example
     * // Get one TrendRecord
     * const trendRecord = await prisma.trendRecord.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TrendRecordFindFirstOrThrowArgs>(args?: SelectSubset<T, TrendRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__TrendRecordClient<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TrendRecords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrendRecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TrendRecords
     * const trendRecords = await prisma.trendRecord.findMany()
     * 
     * // Get first 10 TrendRecords
     * const trendRecords = await prisma.trendRecord.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const trendRecordWithIdOnly = await prisma.trendRecord.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TrendRecordFindManyArgs>(args?: SelectSubset<T, TrendRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TrendRecord.
     * @param {TrendRecordCreateArgs} args - Arguments to create a TrendRecord.
     * @example
     * // Create one TrendRecord
     * const TrendRecord = await prisma.trendRecord.create({
     *   data: {
     *     // ... data to create a TrendRecord
     *   }
     * })
     * 
     */
    create<T extends TrendRecordCreateArgs>(args: SelectSubset<T, TrendRecordCreateArgs<ExtArgs>>): Prisma__TrendRecordClient<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TrendRecords.
     * @param {TrendRecordCreateManyArgs} args - Arguments to create many TrendRecords.
     * @example
     * // Create many TrendRecords
     * const trendRecord = await prisma.trendRecord.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TrendRecordCreateManyArgs>(args?: SelectSubset<T, TrendRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TrendRecords and returns the data saved in the database.
     * @param {TrendRecordCreateManyAndReturnArgs} args - Arguments to create many TrendRecords.
     * @example
     * // Create many TrendRecords
     * const trendRecord = await prisma.trendRecord.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TrendRecords and only return the `id`
     * const trendRecordWithIdOnly = await prisma.trendRecord.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TrendRecordCreateManyAndReturnArgs>(args?: SelectSubset<T, TrendRecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TrendRecord.
     * @param {TrendRecordDeleteArgs} args - Arguments to delete one TrendRecord.
     * @example
     * // Delete one TrendRecord
     * const TrendRecord = await prisma.trendRecord.delete({
     *   where: {
     *     // ... filter to delete one TrendRecord
     *   }
     * })
     * 
     */
    delete<T extends TrendRecordDeleteArgs>(args: SelectSubset<T, TrendRecordDeleteArgs<ExtArgs>>): Prisma__TrendRecordClient<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TrendRecord.
     * @param {TrendRecordUpdateArgs} args - Arguments to update one TrendRecord.
     * @example
     * // Update one TrendRecord
     * const trendRecord = await prisma.trendRecord.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TrendRecordUpdateArgs>(args: SelectSubset<T, TrendRecordUpdateArgs<ExtArgs>>): Prisma__TrendRecordClient<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TrendRecords.
     * @param {TrendRecordDeleteManyArgs} args - Arguments to filter TrendRecords to delete.
     * @example
     * // Delete a few TrendRecords
     * const { count } = await prisma.trendRecord.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TrendRecordDeleteManyArgs>(args?: SelectSubset<T, TrendRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TrendRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrendRecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TrendRecords
     * const trendRecord = await prisma.trendRecord.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TrendRecordUpdateManyArgs>(args: SelectSubset<T, TrendRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TrendRecords and returns the data updated in the database.
     * @param {TrendRecordUpdateManyAndReturnArgs} args - Arguments to update many TrendRecords.
     * @example
     * // Update many TrendRecords
     * const trendRecord = await prisma.trendRecord.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TrendRecords and only return the `id`
     * const trendRecordWithIdOnly = await prisma.trendRecord.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TrendRecordUpdateManyAndReturnArgs>(args: SelectSubset<T, TrendRecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TrendRecord.
     * @param {TrendRecordUpsertArgs} args - Arguments to update or create a TrendRecord.
     * @example
     * // Update or create a TrendRecord
     * const trendRecord = await prisma.trendRecord.upsert({
     *   create: {
     *     // ... data to create a TrendRecord
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TrendRecord we want to update
     *   }
     * })
     */
    upsert<T extends TrendRecordUpsertArgs>(args: SelectSubset<T, TrendRecordUpsertArgs<ExtArgs>>): Prisma__TrendRecordClient<$Result.GetResult<Prisma.$TrendRecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TrendRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrendRecordCountArgs} args - Arguments to filter TrendRecords to count.
     * @example
     * // Count the number of TrendRecords
     * const count = await prisma.trendRecord.count({
     *   where: {
     *     // ... the filter for the TrendRecords we want to count
     *   }
     * })
    **/
    count<T extends TrendRecordCountArgs>(
      args?: Subset<T, TrendRecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TrendRecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TrendRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrendRecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TrendRecordAggregateArgs>(args: Subset<T, TrendRecordAggregateArgs>): Prisma.PrismaPromise<GetTrendRecordAggregateType<T>>

    /**
     * Group by TrendRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrendRecordGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TrendRecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TrendRecordGroupByArgs['orderBy'] }
        : { orderBy?: TrendRecordGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TrendRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTrendRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TrendRecord model
   */
  readonly fields: TrendRecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TrendRecord.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TrendRecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TrendRecord model
   */
  interface TrendRecordFieldRefs {
    readonly id: FieldRef<"TrendRecord", 'String'>
    readonly source: FieldRef<"TrendRecord", 'String'>
    readonly topic: FieldRef<"TrendRecord", 'String'>
    readonly score: FieldRef<"TrendRecord", 'Float'>
    readonly delta24h: FieldRef<"TrendRecord", 'Float'>
    readonly url: FieldRef<"TrendRecord", 'String'>
    readonly region: FieldRef<"TrendRecord", 'String'>
    readonly tags: FieldRef<"TrendRecord", 'String'>
    readonly raw: FieldRef<"TrendRecord", 'String'>
    readonly observedAt: FieldRef<"TrendRecord", 'DateTime'>
    readonly language: FieldRef<"TrendRecord", 'String'>
    readonly createdAt: FieldRef<"TrendRecord", 'DateTime'>
    readonly observedBucket: FieldRef<"TrendRecord", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TrendRecord findUnique
   */
  export type TrendRecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * Filter, which TrendRecord to fetch.
     */
    where: TrendRecordWhereUniqueInput
  }

  /**
   * TrendRecord findUniqueOrThrow
   */
  export type TrendRecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * Filter, which TrendRecord to fetch.
     */
    where: TrendRecordWhereUniqueInput
  }

  /**
   * TrendRecord findFirst
   */
  export type TrendRecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * Filter, which TrendRecord to fetch.
     */
    where?: TrendRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrendRecords to fetch.
     */
    orderBy?: TrendRecordOrderByWithRelationInput | TrendRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TrendRecords.
     */
    cursor?: TrendRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrendRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrendRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrendRecords.
     */
    distinct?: TrendRecordScalarFieldEnum | TrendRecordScalarFieldEnum[]
  }

  /**
   * TrendRecord findFirstOrThrow
   */
  export type TrendRecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * Filter, which TrendRecord to fetch.
     */
    where?: TrendRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrendRecords to fetch.
     */
    orderBy?: TrendRecordOrderByWithRelationInput | TrendRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TrendRecords.
     */
    cursor?: TrendRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrendRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrendRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrendRecords.
     */
    distinct?: TrendRecordScalarFieldEnum | TrendRecordScalarFieldEnum[]
  }

  /**
   * TrendRecord findMany
   */
  export type TrendRecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * Filter, which TrendRecords to fetch.
     */
    where?: TrendRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrendRecords to fetch.
     */
    orderBy?: TrendRecordOrderByWithRelationInput | TrendRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TrendRecords.
     */
    cursor?: TrendRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrendRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrendRecords.
     */
    skip?: number
    distinct?: TrendRecordScalarFieldEnum | TrendRecordScalarFieldEnum[]
  }

  /**
   * TrendRecord create
   */
  export type TrendRecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * The data needed to create a TrendRecord.
     */
    data: XOR<TrendRecordCreateInput, TrendRecordUncheckedCreateInput>
  }

  /**
   * TrendRecord createMany
   */
  export type TrendRecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TrendRecords.
     */
    data: TrendRecordCreateManyInput | TrendRecordCreateManyInput[]
  }

  /**
   * TrendRecord createManyAndReturn
   */
  export type TrendRecordCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * The data used to create many TrendRecords.
     */
    data: TrendRecordCreateManyInput | TrendRecordCreateManyInput[]
  }

  /**
   * TrendRecord update
   */
  export type TrendRecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * The data needed to update a TrendRecord.
     */
    data: XOR<TrendRecordUpdateInput, TrendRecordUncheckedUpdateInput>
    /**
     * Choose, which TrendRecord to update.
     */
    where: TrendRecordWhereUniqueInput
  }

  /**
   * TrendRecord updateMany
   */
  export type TrendRecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TrendRecords.
     */
    data: XOR<TrendRecordUpdateManyMutationInput, TrendRecordUncheckedUpdateManyInput>
    /**
     * Filter which TrendRecords to update
     */
    where?: TrendRecordWhereInput
    /**
     * Limit how many TrendRecords to update.
     */
    limit?: number
  }

  /**
   * TrendRecord updateManyAndReturn
   */
  export type TrendRecordUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * The data used to update TrendRecords.
     */
    data: XOR<TrendRecordUpdateManyMutationInput, TrendRecordUncheckedUpdateManyInput>
    /**
     * Filter which TrendRecords to update
     */
    where?: TrendRecordWhereInput
    /**
     * Limit how many TrendRecords to update.
     */
    limit?: number
  }

  /**
   * TrendRecord upsert
   */
  export type TrendRecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * The filter to search for the TrendRecord to update in case it exists.
     */
    where: TrendRecordWhereUniqueInput
    /**
     * In case the TrendRecord found by the `where` argument doesn't exist, create a new TrendRecord with this data.
     */
    create: XOR<TrendRecordCreateInput, TrendRecordUncheckedCreateInput>
    /**
     * In case the TrendRecord was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TrendRecordUpdateInput, TrendRecordUncheckedUpdateInput>
  }

  /**
   * TrendRecord delete
   */
  export type TrendRecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
    /**
     * Filter which TrendRecord to delete.
     */
    where: TrendRecordWhereUniqueInput
  }

  /**
   * TrendRecord deleteMany
   */
  export type TrendRecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrendRecords to delete
     */
    where?: TrendRecordWhereInput
    /**
     * Limit how many TrendRecords to delete.
     */
    limit?: number
  }

  /**
   * TrendRecord without action
   */
  export type TrendRecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrendRecord
     */
    select?: TrendRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrendRecord
     */
    omit?: TrendRecordOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TrendRecordScalarFieldEnum: {
    id: 'id',
    source: 'source',
    topic: 'topic',
    score: 'score',
    delta24h: 'delta24h',
    url: 'url',
    region: 'region',
    tags: 'tags',
    raw: 'raw',
    observedAt: 'observedAt',
    language: 'language',
    createdAt: 'createdAt',
    observedBucket: 'observedBucket'
  };

  export type TrendRecordScalarFieldEnum = (typeof TrendRecordScalarFieldEnum)[keyof typeof TrendRecordScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    
  /**
   * Deep Input Types
   */


  export type TrendRecordWhereInput = {
    AND?: TrendRecordWhereInput | TrendRecordWhereInput[]
    OR?: TrendRecordWhereInput[]
    NOT?: TrendRecordWhereInput | TrendRecordWhereInput[]
    id?: StringFilter<"TrendRecord"> | string
    source?: StringFilter<"TrendRecord"> | string
    topic?: StringFilter<"TrendRecord"> | string
    score?: FloatFilter<"TrendRecord"> | number
    delta24h?: FloatNullableFilter<"TrendRecord"> | number | null
    url?: StringNullableFilter<"TrendRecord"> | string | null
    region?: StringNullableFilter<"TrendRecord"> | string | null
    tags?: StringFilter<"TrendRecord"> | string
    raw?: StringNullableFilter<"TrendRecord"> | string | null
    observedAt?: DateTimeFilter<"TrendRecord"> | Date | string
    language?: StringNullableFilter<"TrendRecord"> | string | null
    createdAt?: DateTimeFilter<"TrendRecord"> | Date | string
    observedBucket?: DateTimeNullableFilter<"TrendRecord"> | Date | string | null
  }

  export type TrendRecordOrderByWithRelationInput = {
    id?: SortOrder
    source?: SortOrder
    topic?: SortOrder
    score?: SortOrder
    delta24h?: SortOrderInput | SortOrder
    url?: SortOrderInput | SortOrder
    region?: SortOrderInput | SortOrder
    tags?: SortOrder
    raw?: SortOrderInput | SortOrder
    observedAt?: SortOrder
    language?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    observedBucket?: SortOrderInput | SortOrder
  }

  export type TrendRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TrendRecordWhereInput | TrendRecordWhereInput[]
    OR?: TrendRecordWhereInput[]
    NOT?: TrendRecordWhereInput | TrendRecordWhereInput[]
    source?: StringFilter<"TrendRecord"> | string
    topic?: StringFilter<"TrendRecord"> | string
    score?: FloatFilter<"TrendRecord"> | number
    delta24h?: FloatNullableFilter<"TrendRecord"> | number | null
    url?: StringNullableFilter<"TrendRecord"> | string | null
    region?: StringNullableFilter<"TrendRecord"> | string | null
    tags?: StringFilter<"TrendRecord"> | string
    raw?: StringNullableFilter<"TrendRecord"> | string | null
    observedAt?: DateTimeFilter<"TrendRecord"> | Date | string
    language?: StringNullableFilter<"TrendRecord"> | string | null
    createdAt?: DateTimeFilter<"TrendRecord"> | Date | string
    observedBucket?: DateTimeNullableFilter<"TrendRecord"> | Date | string | null
  }, "id">

  export type TrendRecordOrderByWithAggregationInput = {
    id?: SortOrder
    source?: SortOrder
    topic?: SortOrder
    score?: SortOrder
    delta24h?: SortOrderInput | SortOrder
    url?: SortOrderInput | SortOrder
    region?: SortOrderInput | SortOrder
    tags?: SortOrder
    raw?: SortOrderInput | SortOrder
    observedAt?: SortOrder
    language?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    observedBucket?: SortOrderInput | SortOrder
    _count?: TrendRecordCountOrderByAggregateInput
    _avg?: TrendRecordAvgOrderByAggregateInput
    _max?: TrendRecordMaxOrderByAggregateInput
    _min?: TrendRecordMinOrderByAggregateInput
    _sum?: TrendRecordSumOrderByAggregateInput
  }

  export type TrendRecordScalarWhereWithAggregatesInput = {
    AND?: TrendRecordScalarWhereWithAggregatesInput | TrendRecordScalarWhereWithAggregatesInput[]
    OR?: TrendRecordScalarWhereWithAggregatesInput[]
    NOT?: TrendRecordScalarWhereWithAggregatesInput | TrendRecordScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TrendRecord"> | string
    source?: StringWithAggregatesFilter<"TrendRecord"> | string
    topic?: StringWithAggregatesFilter<"TrendRecord"> | string
    score?: FloatWithAggregatesFilter<"TrendRecord"> | number
    delta24h?: FloatNullableWithAggregatesFilter<"TrendRecord"> | number | null
    url?: StringNullableWithAggregatesFilter<"TrendRecord"> | string | null
    region?: StringNullableWithAggregatesFilter<"TrendRecord"> | string | null
    tags?: StringWithAggregatesFilter<"TrendRecord"> | string
    raw?: StringNullableWithAggregatesFilter<"TrendRecord"> | string | null
    observedAt?: DateTimeWithAggregatesFilter<"TrendRecord"> | Date | string
    language?: StringNullableWithAggregatesFilter<"TrendRecord"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TrendRecord"> | Date | string
    observedBucket?: DateTimeNullableWithAggregatesFilter<"TrendRecord"> | Date | string | null
  }

  export type TrendRecordCreateInput = {
    id?: string
    source: string
    topic: string
    score: number
    delta24h?: number | null
    url?: string | null
    region?: string | null
    tags: string
    raw?: string | null
    observedAt: Date | string
    language?: string | null
    createdAt?: Date | string
    observedBucket?: Date | string | null
  }

  export type TrendRecordUncheckedCreateInput = {
    id?: string
    source: string
    topic: string
    score: number
    delta24h?: number | null
    url?: string | null
    region?: string | null
    tags: string
    raw?: string | null
    observedAt: Date | string
    language?: string | null
    createdAt?: Date | string
    observedBucket?: Date | string | null
  }

  export type TrendRecordUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    delta24h?: NullableFloatFieldUpdateOperationsInput | number | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    region?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: StringFieldUpdateOperationsInput | string
    raw?: NullableStringFieldUpdateOperationsInput | string | null
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    language?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    observedBucket?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TrendRecordUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    delta24h?: NullableFloatFieldUpdateOperationsInput | number | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    region?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: StringFieldUpdateOperationsInput | string
    raw?: NullableStringFieldUpdateOperationsInput | string | null
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    language?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    observedBucket?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TrendRecordCreateManyInput = {
    id?: string
    source: string
    topic: string
    score: number
    delta24h?: number | null
    url?: string | null
    region?: string | null
    tags: string
    raw?: string | null
    observedAt: Date | string
    language?: string | null
    createdAt?: Date | string
    observedBucket?: Date | string | null
  }

  export type TrendRecordUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    delta24h?: NullableFloatFieldUpdateOperationsInput | number | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    region?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: StringFieldUpdateOperationsInput | string
    raw?: NullableStringFieldUpdateOperationsInput | string | null
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    language?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    observedBucket?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TrendRecordUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    delta24h?: NullableFloatFieldUpdateOperationsInput | number | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    region?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: StringFieldUpdateOperationsInput | string
    raw?: NullableStringFieldUpdateOperationsInput | string | null
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    language?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    observedBucket?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TrendRecordCountOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    topic?: SortOrder
    score?: SortOrder
    delta24h?: SortOrder
    url?: SortOrder
    region?: SortOrder
    tags?: SortOrder
    raw?: SortOrder
    observedAt?: SortOrder
    language?: SortOrder
    createdAt?: SortOrder
    observedBucket?: SortOrder
  }

  export type TrendRecordAvgOrderByAggregateInput = {
    score?: SortOrder
    delta24h?: SortOrder
  }

  export type TrendRecordMaxOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    topic?: SortOrder
    score?: SortOrder
    delta24h?: SortOrder
    url?: SortOrder
    region?: SortOrder
    tags?: SortOrder
    raw?: SortOrder
    observedAt?: SortOrder
    language?: SortOrder
    createdAt?: SortOrder
    observedBucket?: SortOrder
  }

  export type TrendRecordMinOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    topic?: SortOrder
    score?: SortOrder
    delta24h?: SortOrder
    url?: SortOrder
    region?: SortOrder
    tags?: SortOrder
    raw?: SortOrder
    observedAt?: SortOrder
    language?: SortOrder
    createdAt?: SortOrder
    observedBucket?: SortOrder
  }

  export type TrendRecordSumOrderByAggregateInput = {
    score?: SortOrder
    delta24h?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}