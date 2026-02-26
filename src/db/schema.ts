import { pgSchema, text, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";

// Schema isolado para não misturar com outros projetos no mesmo Neon DB
export const miniSchema = pgSchema("mini_3d");

// 1. Enum das etapas do pipeline (Slices)
export const jobStatusEnum = miniSchema.enum("job_status", [
  "pending",    // Foto enviada, aguardando worker
  "ai_2d",      // Slice 1: Removendo fundo e aplicando LoRA Funko
  "ai_3d",      // Slice 1: Gerando a malha base
  "mesh",       // Slice 2 & 3: Cortando pescoço, pinos e K-Means (4 cores)
  "slicer",     // Slice 5: Fatiando no Bambu Studio CLI
  "completed",  // Tudo pronto!
  "error",      // Algo falhou (ex: malha degenerada)
]);

// 2. Tabela de Jobs dentro do schema "mini_3d"
export const jobs = miniSchema.table("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"), // Futuro: integrar com Auth
  status: jobStatusEnum("status").default("pending").notNull(),

  // URLs dos arquivos no S3/R2
  originalImageUrl: text("original_image_url"),
  meshUrl: text("mesh_url"),          // Preview .glb para o visualizador 3D
  final3mfUrl: text("final_3mf_url"), // Arquivo final para download
  gcodeUrl: text("gcode_url"),        // (Opcional) G-Code fatiado

  // Metadados
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});