-- fix_performance_indexes: performance gaps audit - add composite indexes
-- 1) invitations(code,status) para lookup por code + filtro status
-- 2) post_children(child_id,post_id) para búsquedas por child
-- 3) comments(post_id,created_at) para feed/order por fecha

-- 1) invitations: compuesto code + status (recomendado auditoría; evita seq scan en where code=? and status=?)
create index if not exists invitations_code_status_idx
  on public.invitations (code, status);

-- 2) post_children: compuesto child_id + post_id (complementa PK post_id,child_id y el idx simple child_id)
create index if not exists post_children_child_id_post_id_idx
  on public.post_children (child_id, post_id);

-- 3) comments: compuesto post_id + created_at (optimiza where post_id=? order by created_at)
create index if not exists comments_post_id_created_at_idx
  on public.comments (post_id, created_at);
