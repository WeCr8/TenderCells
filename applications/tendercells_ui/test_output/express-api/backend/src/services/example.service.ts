// example.service.ts
interface Example {
  id: string;
  [key: string]: any;
}

const items: Example[] = [];

export async function list(): Promise<Example[]> {
  return items;
}

export async function getById(id: string): Promise<Example | undefined> {
  return items.find(item => item.id === id);
}

export async function create(data: Partial<Example>): Promise<Example> {
  const item: Example = {
    id: `example_${Date.now()}`,
    ...data,
  };
  items.push(item);
  return item;
}
