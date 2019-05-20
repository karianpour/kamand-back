export function pause(timout: number): Promise<void> {
  // tslint:disable-next-line:no-shadowed-variable
  return new Promise((resolve) => {
    setTimeout(() => resolve(), timout);
  });
}
