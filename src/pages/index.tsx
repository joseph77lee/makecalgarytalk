import FeedFreeBoard from "@/components/FeedFreeBoard";
import FeedFreeBoardItem from "@/components/FeedFreeBoardItem";
import MainMenu from "@/components/MainMenu";
import PostFreeBoard from "@/components/PostFreeBoard";

export default function Home() {
  return (
    <>
      <div className="mx-auto max-w-full md:max-w-7xl">
        <div className="w-full px-6 grid grid-cols-8 gap-4">
          <aside className="hidden md:flex md:flex-col sticky top-0 md:col-span-2">
            <MainMenu />
          </aside>
          <main className="col-span-8 md:col-span-6 min-h-screen bg-blue-100">
            <PostFreeBoard />
            <FeedFreeBoard />
          </main>
        </div>
      </div>
    </>
  );
}
