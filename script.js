// Minimal sticky notes logic: create, drag (pointer events), edit, persist to localStorage
;(function(){
  const board = document.getElementById('board')
  const addBtn = document.getElementById('addBtn')
  const clearBtn = document.getElementById('clearBtn')
  const STORAGE_KEY = 'sticky.notes.v1'

  let notes = loadNotes()
  let zTop = 1

  function saveNotes(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }
  function loadNotes(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }catch(e){return []}
  }

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6) }

  function createNoteData(options={}){
    return Object.assign({
      id: uid(), x: 40 + Math.random()*100, y: 40 + Math.random()*80, w:200, h:160,
      color: 'yellow', content: 'New note'
    }, options)
  }

  function render(){
    board.innerHTML = ''
    notes.forEach(n => {
      const el = buildNoteElement(n)
      board.appendChild(el)
    })
  }

  function buildNoteElement(n){
    const el = document.createElement('div')
    el.className = 'note'
    el.dataset.id = n.id
    el.dataset.color = n.color
    el.style.left = n.x + 'px'
    el.style.top = n.y + 'px'
    el.style.width = n.w + 'px'
    el.style.height = n.h + 'px'
    el.style.zIndex = n.z || 1

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar-note'

    const left = document.createElement('div')
    left.style.display = 'flex'; left.style.alignItems = 'center'
    const dot = document.createElement('div'); dot.className='dot'; left.appendChild(dot)

    const actions = document.createElement('div'); actions.className = 'actions'
    const del = document.createElement('button'); del.textContent = 'Delete'
    del.addEventListener('click', (e)=>{ e.stopPropagation(); deleteNote(n.id) })
    actions.appendChild(del)

    const colorPicker = document.createElement('div'); colorPicker.className='color-picker'
    ;['yellow','pink','green','blue','orange'].forEach(c=>{
      const s = document.createElement('div'); s.className='color-swatch'; s.style.background = getColor(c)
      s.title = c
      s.addEventListener('click', (ev)=>{ ev.stopPropagation(); setColor(n.id, c) })
      colorPicker.appendChild(s)
    })
    actions.appendChild(colorPicker)

    toolbar.appendChild(left)
    toolbar.appendChild(actions)

    const content = document.createElement('div')
    content.className = 'content'
    content.contentEditable = true
    content.innerHTML = n.content
    content.addEventListener('input', ()=>{ updateContent(n.id, content.innerHTML) })

    el.appendChild(toolbar)
    el.appendChild(content)

    // dragging (pointer events)
    el.addEventListener('pointerdown', onPointerDown)
    // bring to front on pointerdown
    el.addEventListener('pointerdown', ()=>{ bringToFront(n.id, el) })

    // double click to focus content
    el.addEventListener('dblclick', () => { content.focus() })

    return el
  }

  function getColor(name){
    switch(name){
      case 'pink': return '#ffcccb'
      case 'green': return '#b9f6ca'
      case 'blue': return '#b3e5fc'
      case 'orange': return '#ffd7a8'
      default: return '#fff59a'
    }
  }

  function bringToFront(id, el){
    zTop += 1
    el.style.zIndex = zTop
    const note = notes.find(x=>x.id===id)
    if(note) note.z = zTop
    saveNotes()
  }

  function onPointerDown(e){
    // ignore pointerdown when clicking inside editable content and it's focused
    const noteEl = e.currentTarget
    // start dragging only when the target is not the inner content editing cursor
    const contentEl = noteEl.querySelector('.content')
    // if pointerdown inside content but not on selection caret, still allow dragging only when user doesn't focus content

    const startX = e.clientX, startY = e.clientY
    const rect = noteEl.getBoundingClientRect()
    const offsetX = startX - rect.left
    const offsetY = startY - rect.top

    noteEl.setPointerCapture(e.pointerId)
    noteEl.classList.add('dragging')

    function onPointerMove(ev){
      ev.preventDefault()
      const nx = ev.clientX - offsetX
      const ny = ev.clientY - offsetY
      noteEl.style.left = nx + 'px'
      noteEl.style.top = ny + 'px'
    }
    function onPointerUp(ev){
      noteEl.releasePointerCapture(e.pointerId)
      noteEl.classList.remove('dragging')
      // save position
      const id = noteEl.dataset.id
      const n = notes.find(x=>x.id===id)
      if(n){
        n.x = parseInt(noteEl.style.left,10) || 0
        n.y = parseInt(noteEl.style.top,10) || 0
        saveNotes()
      }
      noteEl.removeEventListener('pointermove', onPointerMove)
      noteEl.removeEventListener('pointerup', onPointerUp)
      noteEl.removeEventListener('pointercancel', onPointerUp)
    }

    noteEl.addEventListener('pointermove', onPointerMove)
    noteEl.addEventListener('pointerup', onPointerUp)
    noteEl.addEventListener('pointercancel', onPointerUp)
  }

  function updateContent(id, html){
    const n = notes.find(x=>x.id===id); if(!n) return
    n.content = html
    saveNotes()
  }

  function setColor(id, color){
    const n = notes.find(x=>x.id===id); if(!n) return
    n.color = color
    saveNotes(); render()
  }

  function deleteNote(id){
    notes = notes.filter(x=>x.id!==id)
    saveNotes(); render()
  }

  function addNote(){
    const n = createNoteData({content: 'New note', x: 60 + Math.random()*140, y: 80 + Math.random()*120})
    notes.push(n)
    saveNotes(); render()
  }

  function clearAll(){
    if(!confirm('Remove all notes?')) return
    notes = []
    saveNotes(); render()
  }

  // wire buttons
  addBtn.addEventListener('click', addNote)
  clearBtn.addEventListener('click', clearAll)

  // initial render
  if(notes.length===0){
    // create one sample note to start
    notes.push(createNoteData({content: '<strong>Tip</strong>: Drag notes to move. Double-click to edit.', x:60, y:80}))
    saveNotes()
  }
  render()

})();
