import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { galleryApi, getErrorMessage } from "../api/client";
import type { Collection, CollectionItem } from "../types";
import { ErrorPanel, Loading } from "../components/Status";

const reorder = (items: CollectionItem[], from: number, to: number) => {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((entry, index) => ({ ...entry, position: index }));
};

const isInteractiveElement = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest("button, textarea, input, select, a, label"));

type TouchDragState = {
  touchId: number;
  fromIndex: number;
  overIndex: number;
  startX: number;
  startY: number;
  active: boolean;
  timer: number | null;
};

const emptyTouchDrag = (): TouchDragState | null => null;

export const CollectionEditorPage = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [collection, setCollection] = useState<Collection | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const itemsListRef = useRef<HTMLOListElement | null>(null);
  const desktopDragAllowedRef = useRef(true);
  const touchDragRef = useRef<TouchDragState | null>(emptyTouchDrag());

  useEffect(() => {
    if (!id) return;
    galleryApi.collection(id).then((result) => {
      setCollection(result);
      setTitle(result.title);
      setDescription(result.description);
      setIsPublic(result.isPublic);
      setItems([...result.items].sort((a, b) => a.position - b.position));
    }).catch((reason) => setError(getErrorMessage(reason))).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const list = itemsListRef.current;
    if (!list) return;

    const clearTouchDrag = () => {
      const touchDrag = touchDragRef.current;
      if (touchDrag && touchDrag.timer !== null) window.clearTimeout(touchDrag.timer);
      touchDragRef.current = null;
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    const onTouchMove = (event: TouchEvent) => {
      const touchDrag = touchDragRef.current;
      if (!touchDrag) return;

      const touch = Array.from(event.changedTouches).find((entry) => entry.identifier === touchDrag.touchId)
        ?? Array.from(event.touches).find((entry) => entry.identifier === touchDrag.touchId);
      if (!touch) return;

      if (!touchDrag.active) {
        const distance = Math.hypot(touch.clientX - touchDrag.startX, touch.clientY - touchDrag.startY);
        if (distance > 10) clearTouchDrag();
        return;
      }

      event.preventDefault();
      const edgeScrollZone = 72;
      if (touch.clientY < edgeScrollZone) window.scrollBy(0, -12);
      if (touch.clientY > window.innerHeight - edgeScrollZone) window.scrollBy(0, 12);
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const itemElement = element?.closest<HTMLElement>(".editor-item[data-index]");
      const nextIndex = itemElement ? Number(itemElement.dataset.index) : Number.NaN;
      if (Number.isInteger(nextIndex) && nextIndex !== touchDrag.overIndex) {
        touchDrag.overIndex = nextIndex;
        setDragOverIndex(nextIndex);
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touchDrag = touchDragRef.current;
      if (!touchDrag) return;

      const ended = Array.from(event.changedTouches).some((entry) => entry.identifier === touchDrag.touchId);
      if (!ended) return;

      if (touchDrag.active) {
        event.preventDefault();
        if (touchDrag.fromIndex !== touchDrag.overIndex) {
          setItems((current) => reorder(current, touchDrag.fromIndex, touchDrag.overIndex));
        }
      }
      clearTouchDrag();
    };

    const onTouchCancel = () => clearTouchDrag();

    list.addEventListener("touchmove", onTouchMove, { passive: false });
    list.addEventListener("touchend", onTouchEnd, { passive: false });
    list.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      list.removeEventListener("touchmove", onTouchMove);
      list.removeEventListener("touchend", onTouchEnd);
      list.removeEventListener("touchcancel", onTouchCancel);
      const touchDrag = touchDragRef.current;
      if (touchDrag && touchDrag.timer !== null) window.clearTimeout(touchDrag.timer);
    };
  }, [items.length]);

  const startDesktopDrag = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (!desktopDragAllowedRef.current) {
      event.preventDefault();
      return;
    }
    setDraggedIndex(index);
    setDragOverIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const dropArtwork = (event: DragEvent<HTMLLIElement>, toIndex: number) => {
    event.preventDefault();
    const transferValue = event.dataTransfer.getData("text/plain");
    const transferIndex = transferValue === "" ? null : Number(transferValue);
    const fromIndex = draggedIndex ?? (transferIndex !== null && Number.isInteger(transferIndex) ? transferIndex : null);
    if (fromIndex !== null && fromIndex !== toIndex) {
      setItems((current) => reorder(current, fromIndex, toIndex));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const endDesktopDrag = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const startTouchDrag = (event: ReactTouchEvent<HTMLLIElement>, index: number) => {
    if (event.touches.length !== 1 || isInteractiveElement(event.target)) return;
    const touch = event.touches[0];

    const touchDrag: TouchDragState = {
      touchId: touch.identifier,
      fromIndex: index,
      overIndex: index,
      startX: touch.clientX,
      startY: touch.clientY,
      active: false,
      timer: null,
    };

    touchDrag.timer = window.setTimeout(() => {
      if (touchDragRef.current !== touchDrag) return;
      touchDrag.active = true;
      touchDrag.timer = null;
      setDraggedIndex(index);
      setDragOverIndex(index);
      if (navigator.vibrate) navigator.vibrate(20);
    }, 260);

    touchDragRef.current = touchDrag;
  };

  const handleKeyboardReorder = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (isInteractiveElement(event.target) || !event.altKey) return;
    if (event.key === "ArrowUp" && index > 0) {
      event.preventDefault();
      setItems((current) => reorder(current, index, index - 1));
      window.requestAnimationFrame(() => {
        itemsListRef.current?.querySelector<HTMLElement>(`.editor-item[data-index="${index - 1}"]`)?.focus();
      });
    }
    if (event.key === "ArrowDown" && index < items.length - 1) {
      event.preventDefault();
      setItems((current) => reorder(current, index, index + 1));
      window.requestAnimationFrame(() => {
        itemsListRef.current?.querySelector<HTMLElement>(`.editor-item[data-index="${index + 1}"]`)?.focus();
      });
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { title, description, isPublic, items };
      const result = id ? await galleryApi.updateCollection(id, payload) : await galleryApi.createCollection(payload);
      navigate(`/collections/${result._id}/edit`, { replace: true });
      setCollection(result);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Opening your exhibition…" />;
  if (error && !isNew && !collection) return <div className="page-section page-top"><ErrorPanel message={error} /></div>;

  return (
    <div className="page-section page-top editor-layout">
      <form className="editor-form" onSubmit={submit}>
        <div className="section-heading">
          <div><p className="eyebrow">{isNew ? "New exhibition" : "Exhibition editor"}</p><h1>{isNew ? "Create an exhibition" : "Shape the visitor’s journey"}</h1></div>
          <button className="button primary" disabled={saving}>{saving ? "Saving…" : "Save exhibition"}</button>
        </div>
        <div className="editor-details">
          <div className="field"><label htmlFor="collection-title">Title</label><input id="collection-title" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <div className="field"><label htmlFor="collection-description">Introduction</label><textarea id="collection-description" rows={5} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What connects these works? What should visitors notice?" /></div>
          <label className="checkbox-field"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />Publish as a shareable exhibition</label>
          {collection?.isPublic && <p className="share-line">Public link: <Link to={`/exhibitions/${collection.slug}`}>Open exhibition ↗</Link></p>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <div className="editor-items-heading">
          <div>
            <p className="eyebrow">Exhibition order</p>
            <h2>{items.length ? `${items.length} selected works` : "No works selected"}</h2>
            {items.length > 1 && <p className="drag-instruction">Drag any artwork card to reorder. On a phone, press and hold first. Keyboard: focus a card and press Alt + ↑ or Alt + ↓.</p>}
          </div>
          <Link className="button secondary" to="/explore">Find artworks</Link>
        </div>

        {items.length ? (
          <ol className="editor-items" ref={itemsListRef}>
            {items.map((item, index) => (
              <li
                className={`editor-item${draggedIndex === index ? " is-dragging" : ""}${dragOverIndex === index && draggedIndex !== index ? " is-drag-over" : ""}`}
                key={`${item.artwork.source}-${item.artwork.sourceId}`}
                data-index={index}
                draggable
                tabIndex={0}
                aria-label={`${index + 1} of ${items.length}: ${item.artwork.title}. Drag to reorder, or use Alt plus an arrow key.`}
                onPointerDown={(event) => { desktopDragAllowedRef.current = !isInteractiveElement(event.target); }}
                onPointerUp={() => { desktopDragAllowedRef.current = true; }}
                onPointerCancel={() => { desktopDragAllowedRef.current = true; }}
                onDragStart={(event) => startDesktopDrag(event, index)}
                onDragEnd={() => { desktopDragAllowedRef.current = true; endDesktopDrag(); }}
                onDragOver={(event) => {
                  if (draggedIndex === null) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverIndex(index);
                }}
                onDrop={(event) => dropArtwork(event, index)}
                onTouchStart={(event) => startTouchDrag(event, index)}
                onKeyDown={(event) => handleKeyboardReorder(event, index)}
              >
                <img src={item.artwork.thumbnailUrl || item.artwork.imageUrl} alt={item.artwork.title} draggable={false} />
                <div className="editor-item-copy">
                  <p className="eyebrow">{index + 1}. {item.artwork.museumName}</p>
                  <h3>{item.artwork.title}</h3>
                  <p>{item.artwork.artist}</p>
                  <label htmlFor={`note-${index}`}>Curator note</label>
                  <textarea
                    id={`note-${index}`}
                    rows={3}
                    maxLength={1200}
                    value={item.curatorNote}
                    onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, curatorNote: event.target.value } : entry))}
                  />
                </div>
                <div className="editor-item-actions">
                  <button className="danger editor-remove-button" type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index).map((entry, itemIndex) => ({ ...entry, position: itemIndex })))}>Remove</button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="status-panel"><p>Save this exhibition, then browse the gallery and use “Add to exhibition” on any artwork.</p></div>
        )}
      </form>
    </div>
  );
};
