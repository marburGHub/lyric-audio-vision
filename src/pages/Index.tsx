
import AudioPlayer from "@/components/AudioPlayer";

const Index = () => {
  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Lyric Audio Vision
        </h1>
        <AudioPlayer />
      </div>
    </div>
  );
};

export default Index;
