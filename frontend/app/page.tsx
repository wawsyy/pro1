import { EncryptedPollExperience } from "@/components/EncryptedPollExperience";

export default function Home() {
  return (
    <main className="px-4 pb-16 md:px-0">
      <div className="flex w-full justify-center">
        <div className="w-full max-w-5xl">
          <EncryptedPollExperience />
        </div>
      </div>
    </main>
  );
}
