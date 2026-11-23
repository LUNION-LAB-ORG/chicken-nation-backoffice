'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import Image from 'next/image';
import { Ad } from '@/types/ad';

interface CreateAdProps {
  onCancel: () => void
  onSuccess?: (ad: Ad) => void
}

export default function CreateAd({ onCancel, onSuccess }: CreateAdProps) {
  const [title, setTitle] = useState('Titre de l\'événement')
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState<'none' | 'text' | 'background'>('none')
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null)

  // Focus sur l'éditeur au montage
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }, [])

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (message: string, type: 'error' | 'success') => {
    setNotification({ message, type })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        showNotification('Veuillez sélectionner un fichier image valide (.jpg, .png)', 'error')
        return
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showNotification('La taille de l\'image ne doit pas dépasser 10MB', 'error')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        if (file.size <= 10 * 1024 * 1024) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setSelectedImage(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        } else {
          showNotification('La taille de l\'image ne doit pas dépasser 10MB', 'error')
        }
      } else {
        showNotification('Veuillez déposer un fichier image valide (.jpg, .png)', 'error')
      }
    }
  }

  const handleSubmit = () => {
    // Récupérer le contenu HTML de l'éditeur
    const editorContent = editorRef.current?.innerHTML || ''

    // Créer l'objet publicité
    const newAd: Ad = {
      title,
      content: editorContent,
      image: selectedImage,
      createdAt: new Date().toISOString(),
      status: 'draft'
    }

    // Appeler la fonction de succès si elle existe
    if (onSuccess) {
      onSuccess(newAd)
    }
  }

  const handleTitleClick = () => {
    setIsEditingTitle(true)
    setTimeout(() => {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }, 0)
  }

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
    if (title.trim() === '') {
      setTitle('Titre de l\'événement')
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false)
    }
  }

  // Fonction pour insérer du texte à la position du curseur
  const insertTextAtCursor = (text: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // Si pas de sélection, ajouter à la fin
        editorRef.current.appendChild(document.createTextNode(text))
      }
      // Mettre à jour le contenu
      setContent(editorRef.current.innerHTML)
    }
  }

  const insertHashtag = () => {
    insertTextAtCursor('#')
  }

  const insertEmoji = (emoji: string) => {
    insertTextAtCursor(emoji)
    setShowEmojiPicker(false)
  }

  // List of emojis
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '🔥', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬'
  ]

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  // Custom format functions pour l'éditeur contentEditable
  const formatText = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand(command, false, value)
      // Mettre à jour le contenu
      setContent(editorRef.current.innerHTML)
    }
  }

  const handleColorChange = (type: 'backColor' | 'foreColor') => {
    setShowColorPicker(type === 'backColor' ? 'background' : 'text')
  }

  const applyColor = (color: string) => {
    const type = showColorPicker === 'background' ? 'backColor' : 'foreColor'
    formatText(type, color)
    setShowColorPicker('none')
  }

  const handleLink = () => {
    setShowLinkDialog(true)
  }

  const applyLink = () => {
    if (linkUrl.trim()) {
      formatText('createLink', linkUrl)
      setLinkUrl('')
      setShowLinkDialog(false)
    }
  }

  const cancelLink = () => {
    setLinkUrl('')
    setShowLinkDialog(false)
  }

  // Gérer les changements de contenu
  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML)
    }
  }

  // Function to get preview content with formatting
  const getPreviewContent = () => {
    return content || "Rum doluptatium quam, odit modia nulluptistem eum qui coribus tentia volessi doluptas acerum volore non pro doluptur, unti deles si dit et a voluptur ame lab inus nam quas nonsequ odiorport alicium resequo distiunt adipsum fugiti dolorit"
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Formulaire de création */}
      <div className="flex-1 w-1.5 pr-30">
        {/* Titre de l'événement avec icône d'édition */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-2xl font-normal text-gray-500 bg-transparent border-none outline-none focus:outline-none flex-1"
                placeholder="Titre de l'événement"
                title="Modifier le titre de l'événement"
                aria-label="Titre de l'événement"
              />
            ) : (
              <>
                <h2 className="text-2xl font-normal text-gray-500 flex-1">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={handleTitleClick}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Modifier le titre"
                  aria-label="Modifier le titre"
                >
                  <Edit3 size={20} />
                </button>
              </>
            )}
          </div>

          {/* Zone de dépôt d'image - Bordure normale, fond blanc */}
          <div
            className="relative border-2 border-gray-300 rounded-2xl bg-white hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 cursor-pointer min-h-[120px] flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!selectedImage ? (
              <div className="flex items-center justify-center w-full px-6 py-4">
                {/* Icône simple sans bordure */}
                <div className="flex-shrink-0 mr-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>

                {/* Texte à droite */}
                <div className="text-center">
                  <p className="text-gray-600 text-base font-medium mb-1">
                    Déposer une image ici
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    (1080 x 1080px ou 2000 x 2000 px<br />
                    en format .jpg ou .png)
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-48 rounded-xl overflow-hidden m-2">
                <Image
                  src={selectedImage}
                  alt="Image sélectionnée"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="px-3 py-1 bg-white bg-opacity-90 text-gray-700 text-sm rounded-md hover:bg-opacity-100 transition-all"
                      title="Changer l'image"
                      aria-label="Changer l'image"
                    >
                      Changer
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage(null)
                      }}
                      className="px-3 py-1 bg-red-500 bg-opacity-90 text-blanc text-sm rounded-md hover:bg-opacity-100 transition-all"
                      title="Supprimer l'image"
                      aria-label="Supprimer l'image"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Corps du message */}
        <div className="mb-6">
          {/* Zone de texte avec titre intégré - Éditeur personnalisé */}
          <div className="border border-gray-300 rounded-lg bg-white mb-4">
            {/* Titre non-modifiable dans l'éditeur */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-lg font-medium text-gray-800">Corps du message</h3>
            </div>

            {/* Éditeur ContentEditable personnalisé */}
            <div className="px-4 py-2">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning={true}
                onInput={handleContentChange}
                className="min-h-[140px] p-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
                style={{
                  lineHeight: '1.6',
                  fontSize: '14px'
                }}
               
              />
            </div>

            {/* Zone hashtag cliquable */}
            <div className="px-4 pb-3 border-t border-gray-100">
              <button
                type="button"
                onClick={insertHashtag}
                className="text-gray-400 text-lg hover:text-gray-600 transition-colors"
                title="Insérer un hashtag"
                aria-label="Insérer un hashtag"
              >
                #
              </button>
            </div>
          </div>

          {/* Barre d'outils de formatage séparée - avec vraies icônes de formatage */}
          <div className="border border-gray-300 rounded-lg bg-white">
            <div className="flex items-center justify-center px-4 py-4">
              <div className="flex items-center justify-between w-full max-w-md">
                <button
                  type="button"
                  onClick={() => formatText('bold')}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Gras"
                  aria-label="Gras"
                >
                  <span className="text-gray-600 font-bold text-lg">B</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatText('underline')}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Souligné"
                  aria-label="Souligné"
                >
                  <span className="text-gray-600 text-lg underline">U</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatText('italic')}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Italique"
                  aria-label="Italique"
                >
                  <span className="text-gray-600 text-lg italic">I</span>
                </button>

                {/* Bouton de texte barré */}
                <button
                  type="button"
                  onClick={() => formatText('strikeThrough')}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Texte barré"
                  aria-label="Texte barré"
                >
                  <span className="text-gray-600 font-medium text-lg line-through">T</span>
                </button>

                {/* Bouton couleur de fond */}
                <button
                  type="button"
                  onClick={() => handleColorChange('backColor')}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Couleur de fond"
                  aria-label="Couleur de fond"
                >
                  <div className="w-5 h-5 bg-black rounded"></div>
                </button>

                {/* Bouton couleur de texte */}
                <button
                  type="button"
                  onClick={() => handleColorChange('foreColor')}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Couleur de texte"
                  aria-label="Couleur de texte"
                >
                  <span className="font-bold text-lg text-gray-600">Aa</span>
                </button>

                {/* Alignement */}
                <button
                  type="button"
                  onClick={() => formatText('justifyLeft')}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Alignement à gauche"
                  aria-label="Alignement à gauche"
                >
                  <div className="flex flex-col space-y-1">
                    <div className="h-0.5 bg-gray-600 dark:bg-[#4b5260] w-5"></div>
                    <div className="h-0.5 bg-gray-600 dark:bg-[#4b5260] w-4"></div>
                    <div className="h-0.5 bg-gray-600 dark:bg-[#4b5260] w-5"></div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => formatText('insertUnorderedList')}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Liste à puces"
                  aria-label="Liste à puces"
                >
                  <span className="text-gray-600 text-lg">•</span>
                </button>

                <button
                  type="button"
                  onClick={handleLink}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Insérer un lien"
                  aria-label="Insérer un lien"
                >
                  <span className="text-gray-600 text-lg">🔗</span>
                </button>

                <button
                  type="button"
                  onClick={toggleEmojiPicker}
                  className="p-3 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Insérer un emoji"
                  aria-label="Insérer un emoji"
                >
                  <span className="text-lg">😊</span>
                </button>
              </div>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="border-t border-gray-100 p-4">
                <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-gray-100 rounded text-lg"
                      title={`Insérer ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Picker */}
            {showColorPicker !== 'none' && (
              <div className="border-t border-gray-100 p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {showColorPicker === 'text' ? 'Couleur du texte' : 'Couleur de fond'}
                  </h4>
                  <div className="grid grid-cols-8 gap-2">
                    {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
                      '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#c0c0c0', '#808080',
                      '#ff9999', '#99ff99', '#9999ff', '#ffff99', '#ff99ff', '#99ffff', '#ffcc99', '#cc99ff'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => applyColor(color)}
                        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                        style={{ backgroundColor: color }}
                        title={`Appliquer ${color}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker('none')}
                    className="mt-3 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Link Dialog */}
            {showLinkDialog && (
              <div className="border-t border-gray-100 p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Ajouter un lien</h4>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://exemple.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyLink()
                      } else if (e.key === 'Escape') {
                        cancelLink()
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={applyLink}
                      className="px-4 py-2 bg-[#F17922] text-blanc text-sm rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      onClick={cancelLink}
                      className="px-4 py-2 text-gray-600 text-sm border-1 rounded-xl border-slate-300 hover:text-gray-800 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Options de diffusion */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="app-message"
                className="w-4 h-4 text-[#F17922] border-gray-300 rounded focus:ring-[#F17922]"
                defaultChecked
              />
              <label htmlFor="app-message" className="ml-3 text-sm text-gray-700">
                Message à envoyer aux utilisateurs de l&apos;application
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="social-message"
                className="w-4 h-4 text-gray-300 border-gray-300 rounded focus:ring-gray-300"
                disabled
              />
              <div className="ml-3 flex items-center">
                <label htmlFor="social-message" className="text-sm text-gray-400">
                  Message à envoyer sur les réseaux sociaux
                </label>
                <span className="ml-2 text-xs text-gray-400">(Aperçu non disponible)</span>
              </div>
            </div>

            {/* Sélecteur de limite */}
            <div className="flex items-center mt-4">
              <span className="text-sm text-gray-600 mr-3">Limité</span>
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#F17922]"
                  title="Sélectionner le public cible"
                  aria-label="Sélectionner le public cible"
                >
                  <option>Sélectionnez de noms</option>
                  <option>Tous les utilisateurs</option>
                  <option>Utilisateurs actifs</option>
                  <option>Nouveaux utilisateurs</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4 items-center mt-8 pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 bg-[#F17922] text-blanc rounded-2xl font- cursor-pointer hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:ring-offset-2 transition-colors"
          >
            Envoyer la diffusion
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-[#F17922] text-[#F17922] cursor-pointer rounded-2xl font-medium hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:ring-offset-2 transition-colors whitespace-nowrap"
          >
            Programmer
          </button>
        </div>

        {/* Input file caché */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
          aria-label="Télécharger une image"
          title="Télécharger une image"
        />
      </div>

      {/* Prévisualisation avec background gris qui touche les extrémités */}
      <div className="flex-1 bg-gray-100 -mr-8 -mt-8 -mb-8 pl-8 pt-8 pb-8">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-700">Aperçu sur l&apos;application</h3>
        </div>
        <div className="flex justify-center">
          {/* Contour du téléphone avec bordure grise épaisse */}
          <div className="relative w-72 h-[600px] bg-white rounded-[40px] border-[6px] border-gray-400 shadow-xl overflow-hidden">
            {/* En-tête avec fond beige */}
            <div className="bg-hex-f5e6d3 px-4 py-6 text-center">
              <h4 className="text-gray-800 font-medium text-base">
                {title || "Titre de l'événement"}
              </h4>
            </div>

            {/* Contenu principal */}
            <div className="px-4 py-4 flex-1">
              {/* Zone d'image */}
              {selectedImage ? (
                <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden">
                  <Image
                    src={selectedImage}
                    alt="Aperçu"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-64 mb-6 bg-gray-300 rounded-2xl flex items-center justify-center">
                  <div className="text-gray-500">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Zone de texte avec formatage synchronisé */}
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'error'
            ? 'bg-red-500 text-blanc'
            : 'bg-green-500 text-blanc'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="ml-2 text-blanc hover:text-gray-200 transition-colors"
              title="Fermer la notification"
              aria-label="Fermer la notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
