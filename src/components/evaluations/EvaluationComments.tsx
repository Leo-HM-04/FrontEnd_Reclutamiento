"use client";

import { useState, useEffect } from "react";

interface EvaluationComment {
  id: number;
  evaluation: number;
  evaluation_info?: string;
  user: number;
  user_name?: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  updated_at?: string;
}

export default function EvaluationComments() {
  const [comments, setComments] = useState<EvaluationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "internal" | "public">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/evaluations/comments/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este comentario?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/evaluations/comments/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setComments(comments.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesType = true;
    if (filterType === "internal") matchesType = comment.is_internal;
    if (filterType === "public") matchesType = !comment.is_internal;

    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Cargando comentarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Comentarios de Evaluación</h3>
            <p className="text-sm text-gray-600 mt-1">
              {comments.length} comentarios registrados
            </p>
          </div>
          <button className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i className="fas fa-plus mr-2"></i>
            Nuevo Comentario
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Comentarios</p>
                <p className="text-2xl font-bold text-gray-900">{comments.length}</p>
              </div>
              <i className="fas fa-comments text-3xl text-gray-400"></i>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Comentarios Internos</p>
                <p className="text-2xl font-bold text-purple-900">
                  {comments.filter((c) => c.is_internal).length}
                </p>
              </div>
              <i className="fas fa-lock text-3xl text-purple-400"></i>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Comentarios Públicos</p>
                <p className="text-2xl font-bold text-green-900">
                  {comments.filter((c) => !c.is_internal).length}
                </p>
              </div>
              <i className="fas fa-globe text-3xl text-green-400"></i>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar comentarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType("internal")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === "internal"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Internos
            </button>
            <button
              onClick={() => setFilterType("public")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === "public"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Públicos
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-comment-slash text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">No se encontraron comentarios</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                comment.is_internal
                  ? "border-purple-200 bg-purple-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    comment.is_internal
                      ? "bg-purple-600 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  <span className="text-sm font-semibold">
                    {getInitials(comment.user_name)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {comment.user_name || `Usuario #${comment.user}`}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                    {comment.is_internal && (
                      <>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="px-2 py-0.5 text-xs bg-purple-200 text-purple-800 rounded">
                          <i className="fas fa-lock mr-1"></i>
                          Interno
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-2">{comment.comment}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Evaluación #{comment.evaluation}</span>
                    {comment.updated_at && comment.updated_at !== comment.created_at && (
                      <>
                        <span>•</span>
                        <span>Editado: {formatDate(comment.updated_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
