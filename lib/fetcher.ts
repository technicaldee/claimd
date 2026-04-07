export async function fetcher<T>(input: string): Promise<T> {
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.json() as Promise<T>;
}
