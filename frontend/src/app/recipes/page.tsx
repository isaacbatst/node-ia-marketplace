"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Trash2, Download, Calendar } from "lucide-react"
import { getRecipeFiles, uploadRecipeFile, deleteRecipeFile } from "@/lib/mockBackend"
import type { RecipeFile } from "@/lib/types"

export default function RecipesPage() {
  const [recipeFiles, setRecipeFiles] = useState<RecipeFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadRecipeFiles()
  }, [])

  const loadRecipeFiles = async () => {
    setLoading(true)
    try {
      const files = await getRecipeFiles()
      setRecipeFiles(files)
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      alert("Por favor, selecione apenas arquivos PDF")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert("Arquivo muito grande. Limite de 10MB")
      return
    }

    setUploading(true)
    try {
      await uploadRecipeFile(file)
      await loadRecipeFiles()
      alert("Arquivo enviado com sucesso!")
    } catch (error) {
      console.error("Erro no upload:", error)
      alert("Erro ao enviar arquivo. Tente novamente.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${fileName}"?`)) return

    try {
      await deleteRecipeFile(fileId)
      await loadRecipeFiles()
      alert("Arquivo deletado com sucesso!")
    } catch (error) {
      console.error("Erro ao deletar arquivo:", error)
      alert("Erro ao deletar arquivo. Tente novamente.")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-20 lg:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Receitas</h1>
        <p className="text-gray-600 mt-2">Gerencie seus arquivos PDF de receitas</p>
      </div>

      {/* Upload Area */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Upload de Receitas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Clique para selecionar ou arraste arquivos aqui</p>
              <p className="text-sm text-gray-500">Apenas arquivos PDF • Máximo 10MB</p>
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />

            <div className="flex justify-center">
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full md:w-auto">
                {uploading ? "Enviando..." : "Selecionar Arquivo PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Arquivos Enviados ({recipeFiles.length})</h2>

        {recipeFiles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum arquivo enviado</h3>
              <p className="text-gray-600">Faça upload de seus PDFs de receitas para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipeFiles.map((file) => (
              <Card key={file.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{file.fileName}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(file.uploadDate)}</span>
                      </div>
                      <p>Tamanho: {formatFileSize(file.size)}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id, file.fileName)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Dicas:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Você também pode fazer upload via chat com o assistente</li>
            <li>• Organize suas receitas em PDFs separados por categoria</li>
            <li>• O assistente pode analisar seus PDFs e sugerir ingredientes</li>
            <li>• Use nomes descritivos para facilitar a organização</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
