import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to dev boilerplate!</h1>
      <div className="w-full max-w-md space-y-4">
        <Label htmlFor="temp-input">Temporary Text Input</Label>
        <Input id="temp-input" type="text" placeholder="Enter some text here..." />
        <p className="text-sm text-muted-foreground">
          This is a temporary input field. You can replace it with your content.
        </p>
      </div>
    </div>
  )
}
