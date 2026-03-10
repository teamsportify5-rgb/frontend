import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { aiService, AIImageResponse } from '@/services/ai.service'
import { Wand2, Loader2, Image as ImageIcon, Download, BarChart3, Package, Sparkles } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
export default function AIImage() {
  const [prompt, setPrompt] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [performanceLoading, setPerformanceLoading] = useState(false)
  const [stockLoading, setStockLoading] = useState(false)
  const [images, setImages] = useState<AIImageResponse[]>([])
  const [generatedImage, setGeneratedImage] = useState<AIImageResponse | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    fetchUserImages()
  }, [])

  const fetchUserImages = async () => {
    try {
      const data = await aiService.getUserImages()
      setImages(data)
    } catch (error: any) {
      console.error('Error fetching images:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch images',
        variant: 'destructive',
      })
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const result = await aiService.generateImage(prompt, logoFile)
      setGeneratedImage(result)
      toast({
        title: 'Success',
        description: 'Image generated successfully!',
      })
      // Refresh the list
      await fetchUserImages()
      setPrompt('')
      setLogoFile(null)
    } catch (error: any) {
      console.error('Error generating image:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate image',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imageUrl: string): string => {
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    // Otherwise, prepend the API base URL
    const apiBaseUrl = api.defaults.baseURL || 'http://localhost:8000'
    return `${apiBaseUrl}${imageUrl}`
  }

  const handleDownload = async (imageUrl: string, promptText: string) => {
    try {
      const fullUrl = getImageUrl(imageUrl)
      const response = await fetch(fullUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ai-image-${promptText.substring(0, 20).replace(/\s/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      toast({
        title: 'Error',
        description: 'Failed to download image',
        variant: 'destructive',
      })
    }
  }

  const handleGeneratePerformanceSummary = async () => {
    setPerformanceLoading(true)
    try {
      const result = await aiService.generatePerformanceSummary()
      setGeneratedImage(result)
      toast({
        title: 'Success',
        description: 'Sportify performance summary generated successfully!',
      })
      await fetchUserImages()
    } catch (error: any) {
      console.error('Error generating performance summary:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate performance summary',
        variant: 'destructive',
      })
    } finally {
      setPerformanceLoading(false)
    }
  }

  const handleGenerateStockSummary = async () => {
    setStockLoading(true)
    try {
      const result = await aiService.generateStockSummary()
      setGeneratedImage(result)
      toast({
        title: 'Success',
        description: 'Stock summary generated successfully!',
      })
      await fetchUserImages()
    } catch (error: any) {
      console.error('Error generating stock summary:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate stock summary',
        variant: 'destructive',
      })
    } finally {
      setStockLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Image & Visual Reporting</h1>
        <p className="text-muted-foreground">
          Auto-generate visual summaries of Sportify performance and stock using GPT Image 1 API, or create custom images.
        </p>
      </div>

      {/* Auto-Generated Visual Summaries */}
      {isAdminOrManager && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Sportify Performance Summary</CardTitle>
              </div>
              <CardDescription>
                Auto-generate a visual summary of Sportify performance including orders, attendance, and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGeneratePerformanceSummary}
                disabled={performanceLoading}
                className="w-full"
              >
                {performanceLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Performance Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle>Stock & Inventory Summary</CardTitle>
              </div>
              <CardDescription>
                Auto-generate a visual summary of inventory levels, stock status, and low stock alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGenerateStockSummary}
                disabled={stockLoading}
                className="w-full"
              >
                {stockLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Stock Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Image Generation Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            <CardTitle>Generate New Image</CardTitle>
          </div>
          <CardDescription>
            Describe the image you want to generate. Optionally attach a logo to overlay on top of the result (e.g. pack of shirts with your logo).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Image Prompt</Label>
              <Input
                id="prompt"
                placeholder="e.g., A pack of premium white t-shirts on a clean background"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo / reference image (optional)</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="max-w-xs"
                  disabled={loading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    setLogoFile(f || null)
                  }}
                />
                {logoFile && (
                  <span className="text-sm text-muted-foreground truncate max-w-[180px]" title={logoFile.name}>
                    {logoFile.name}
                  </span>
                )}
                {logoFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLogoFile(null)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                The logo will be placed on top-center of the generated image.
              </p>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Image Display */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
            <CardDescription>Your latest AI-generated image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Prompt:</Label>
              <p className="text-sm text-muted-foreground">{generatedImage.prompt_text}</p>
            </div>
            <div className="relative rounded-lg border overflow-hidden bg-muted">
              <img
                src={getImageUrl(generatedImage.generated_image_url)}
                alt={generatedImage.prompt_text}
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleDownload(generatedImage.generated_image_url, generatedImage.prompt_text)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(getImageUrl(generatedImage.generated_image_url), '_blank')}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Generated Images</CardTitle>
          <CardDescription>History of all images you've generated</CardDescription>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images generated yet. Create your first image above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <Card key={image.image_id} className="overflow-hidden">
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={getImageUrl(image.generated_image_url)}
                      alt={image.prompt_text}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {image.prompt_text}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(image.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(image.generated_image_url, image.prompt_text)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getImageUrl(image.generated_image_url), '_blank')}
                      >
                        <ImageIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




