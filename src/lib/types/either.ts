export type Either<E, A> = Failure<E> | Success<A>;
export type Failure<E> = { success: false; error: E };
export type Success<A> = { success: true; data: A };
