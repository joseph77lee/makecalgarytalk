import MainMenu from "@/components/MainMenu";

export default function Home() {
  return (
    <>
      <div className="mx-auto max-w-full md:max-w-8xl">
        <div className="w-full px-6 grid grid-cols-8 gap-4">
          <aside className="hidden md:flex md:flex-col sticky top-0 md:col-span-2">
            <MainMenu />
          </aside>
          <main className="col-span-8 md:col-span-6 min-h-screen bg-blue-100">
            <p>Content</p>
          </main>
        </div>
      </div>
    </>
  );
}
