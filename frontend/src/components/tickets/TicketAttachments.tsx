import { useState } from 'react';

interface Attachment {
  id: string;
  filename: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  mimeType: string;
  url: string;
}

interface TicketAttachmentsProps {
  ticketId: string;
  attachments: Attachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
}

export function TicketAttachments({
  ticketId,
  attachments,
  onUpload,
  onDelete,
}: TicketAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦';
    if (mimeType.includes('text')) return '📃';
    return '📎';
  };

  const handleFileSelect = async (file: File) => {
    setError('');

    // Validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('Datei zu groß! Maximale Größe: 10MB');
      return;
    }

    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Dateityp nicht erlaubt. Erlaubte Typen: Bilder, PDF, Office-Dokumente, TXT, ZIP');
      return;
    }

    setIsUploading(true);

    try {
      await onUpload(file);
    } catch (err) {
      setError('Fehler beim Hochladen der Datei');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async (attachmentId: string, filename: string) => {
    if (!confirm(`Möchten Sie die Datei "${filename}" wirklich löschen?`)) {
      return;
    }

    try {
      await onDelete(attachmentId);
    } catch (err) {
      setError('Fehler beim Löschen der Datei');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Neue Datei hochladen</h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isUploading}
          />

          {isUploading ? (
            <div>
              <span className="text-4xl animate-spin inline-block">⏳</span>
              <p className="mt-2 text-sm text-gray-600">Datei wird hochgeladen...</p>
            </div>
          ) : (
            <div>
              <span className="text-4xl">📤</span>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-blue-600">Klicken Sie hier</span> oder ziehen
                Sie eine Datei hierher
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Erlaubte Formate: Bilder (JPG, PNG, GIF), PDF, Office-Dokumente, TXT, ZIP
              </p>
              <p className="text-xs text-gray-500">Maximale Größe: 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Attachments List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Anhänge ({attachments.length})
        </h3>

        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">📎</span>
            <p className="text-sm">Keine Anhänge vorhanden</p>
            <p className="text-xs mt-1">Laden Sie Dateien hoch, um sie hier zu sehen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {getFileIcon(attachment.mimeType)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)} • Hochgeladen von {attachment.uploadedBy}{' '}
                      am {formatDate(attachment.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <a
                    href={attachment.url}
                    download={attachment.filename}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    title="Herunterladen"
                  >
                    ⬇️
                  </a>
                  <button
                    onClick={() => handleDelete(attachment.id, attachment.filename)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Löschen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Development Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Entwicklungsmodus:</strong> Die Datei-Upload-Funktion simuliert derzeit nur das
          Hochladen. In Sprint 5 wird sie mit dem Backend verbunden und Dateien werden tatsächlich
          gespeichert.
        </p>
      </div>
    </div>
  );
}
