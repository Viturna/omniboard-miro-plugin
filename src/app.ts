// I18N DICTIONARY
const translations: Record<string, Record<string, string>> = {
  en: {
    plugin_title: "Omniboard Miro Plugin",
    import_title: "Import from Omniboard",
    import_desc: "Select your Omniboard export file (.json) to import your elements into Miro.",
    import_drag: "Click or drag .json file here",
    export_title: "Export to Omniboard",
    export_desc: "Export all items from the current Miro board to an Omniboard .json file.",
    export_btn: "Export Board",
    err_select_json: "Error: Please select a JSON file.",
    importing: "Importing...",
    err_invalid_format: "Error: Invalid Omniboard export format.",
    import_success: "Import successful!",
    err_parse: "Error: Failed to parse JSON.",
    exporting: "Exporting...",
    export_success: "Export successful!",
    export_failed: "Export failed."
  },
  fr: {
    plugin_title: "Plugin Omniboard pour Miro",
    import_title: "Importer depuis Omniboard",
    import_desc: "Sélectionnez votre fichier d'export Omniboard (.json) pour importer vos éléments dans Miro.",
    import_drag: "Cliquez ou glissez le fichier .json ici",
    export_title: "Exporter vers Omniboard",
    export_desc: "Exportez tous les éléments du tableau Miro actuel vers un fichier .json Omniboard.",
    export_btn: "Exporter le tableau",
    err_select_json: "Erreur : Veuillez sélectionner un fichier JSON.",
    importing: "Importation en cours...",
    err_invalid_format: "Erreur : Format d'export Omniboard invalide.",
    import_success: "Importation réussie !",
    err_parse: "Erreur : Échec de l'analyse du JSON.",
    exporting: "Exportation en cours...",
    export_success: "Exportation réussie !",
    export_failed: "Échec de l'exportation."
  },
  es: {
    plugin_title: "Plugin de Omniboard para Miro",
    import_title: "Importar desde Omniboard",
    import_desc: "Seleccione su archivo de exportación de Omniboard (.json) para importar sus elementos a Miro.",
    import_drag: "Haga clic o arrastre el archivo .json aquí",
    export_title: "Exportar a Omniboard",
    export_desc: "Exporte todos los elementos del tablero de Miro actual a un archivo .json de Omniboard.",
    export_btn: "Exportar Tablero",
    err_select_json: "Error: Seleccione un archivo JSON.",
    importing: "Importando...",
    err_invalid_format: "Error: Formato de exportación de Omniboard no válido.",
    import_success: "¡Importación exitosa!",
    err_parse: "Error: Error al analizar el JSON.",
    exporting: "Exportando...",
    export_success: "¡Exportación exitosa!",
    export_failed: "Error en la exportación."
  }
};

let currentLang = 'en';

function initI18n() {
  const browserLang = (navigator.language || 'en').split('-')[0].toLowerCase();
  if (['fr', 'en', 'es'].includes(browserLang)) {
    currentLang = browserLang;
  }
  
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
}

function t(key: string): string {
  return translations[currentLang][key] || key;
}

initI18n();


function getPathBoundingBox(d: string, strokeWidth: number) {
  const matches = d.match(/-?\d+(\.\d+)?/g);
  if (!matches) return { x: 0, y: 0, w: 100, h: 100 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < matches.length; i += 2) {
    const x = parseFloat(matches[i]);
    const y = parseFloat(matches[i + 1]);
    if (!isNaN(x)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (!isNaN(y)) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const padding = strokeWidth * 2;
  return {
    x: minX - padding,
    y: minY - padding,
    w: Math.max(maxX - minX + padding * 2, 10),
    h: Math.max(maxY - minY + padding * 2, 10)
  };
}

function stripHtml(html: string) {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function hexToRgb(hex: string) {
  // Return the hex directly for Miro, it accepts standard hex strings like '#FFFFFF'
  if (!hex.startsWith('#')) return '#' + hex;
  return hex;
}

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const statusDiv = document.getElementById('status');

if (dropZone && fileInput) {
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });
}

function setStatus(msg: string, color = '#1F1F1F') {
  if (statusDiv) {
    statusDiv.textContent = msg;
    statusDiv.style.color = color;
  }
}

async function handleFile(file: File) {
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    setStatus(t('err_select_json'), '#E53935');
    return;
  }

  setStatus(t('importing'), '#1F1F1F');

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target?.result as string;
      const data = JSON.parse(text);

      if (!data.elements) {
        setStatus(t('err_invalid_format'), '#E53935');
        return;
      }

      await importElements(data.elements);

      setStatus(t('import_success'), '#43A047');
      setTimeout(() => {
        setStatus('');
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setStatus(t('err_parse'), '#E53935');
    }
  };
  reader.readAsText(file);
}

async function importElements(elements: any) {
  const createdItems = [];
  const idMap = new Map<string, string>();

  // Import Notes
  if (elements.notes) {
    for (const note of elements.notes) {
      if (note.tabs && note.tabs.length > 0) {
        let offsetX = 0;
        for (const tab of note.tabs) {
          const content = tab.content ? stripHtml(tab.content) : (tab.title || 'Note');
          const width = note.width || 200;
          const height = note.height || 200;
          const sticky = await miro.board.createStickyNote({
            content: content,
            x: (note.left || 0) + offsetX + width/2,
            y: (note.top || 0) + height/2,
            width: width,
            style: {
              fillColor: note.color === 'yellow' ? 'light_yellow' : 
                         note.color === 'blue' ? 'light_blue' : 
                         note.color === 'green' ? 'light_green' : 
                         note.color === 'pink' ? 'pink' : 'light_yellow',
              textAlign: 'left'
            }
          });
          createdItems.push(sticky);
          if (offsetX === 0) idMap.set(note.id, sticky.id);
          offsetX += 220; // Miro sticky default width is usually around 200
        }
      }
    }
  }

  // Import Tasks
  if (elements.tasks) {
    for (const task of elements.tasks) {
      if (task.tabs && task.tabs.length > 0) {
        let offsetX = 0;
        for (const tab of task.tabs) {
          let content = `<b>${stripHtml(tab.title || 'Tasks')}</b><br><br>`;
          if (tab.items) {
            content += tab.items.map((i: any) => `${i.checked ? '✅' : '⬜️'} ${stripHtml(i.text)}`).join('<br>');
          }
          const width = task.width || 250;
          const height = task.height || 250;
          const shape = await miro.board.createShape({
            content: content,
            shape: 'rectangle',
            x: (task.left || 0) + offsetX + width/2,
            y: (task.top || 0) + height/2,
            width: width,
            style: {
              fillColor: '#ffffff',
              textAlign: 'left',
              textAlignVertical: 'top'
            }
          });
          createdItems.push(shape);
          if (offsetX === 0) idMap.set(task.id, shape.id);
          offsetX += 280;
        }
      }
    }
  }

  // Import Texts
  if (elements.texts) {
    for (const textObj of elements.texts) {
      const width = Math.max(textObj.width || 200, 50);
      const height = textObj.height || 50;
      const text = await miro.board.createText({
        content: textObj.content || textObj.text || '',
        x: (textObj.left || 0) + width/2,
        y: (textObj.top || 0) + height/2,
        width: width,
        style: {
          color: hexToRgb(textObj.color || '#1F1F1F'),
          fontSize: parseInt(textObj.fontSize || 16),
          fontFamily: 'open_sans'
        }
      });
      createdItems.push(text);
      idMap.set(textObj.id, text.id);
    }
  }

  // Import Tables
  if (elements.tables) {
    for (const tableObj of elements.tables) {
      let content = '<b>Table</b><br><br>';
      if (tableObj.data) {
        content += '<table border="1">';
        for (const row of tableObj.data) {
          content += '<tr>';
          for (const cell of row) {
            content += `<td>${stripHtml(cell)}</td>`;
          }
          content += '</tr>';
        }
        content += '</table>';
      }
      const width = Math.max(tableObj.width || 300, 100);
      const height = Math.max(tableObj.height || 200, 100);
      const tableShape = await miro.board.createShape({
        shape: 'rectangle',
        content: content,
        x: (tableObj.left || 0) + width/2,
        y: (tableObj.top || 0) + height/2,
        width: width,
        height: height,
        style: {
          fillColor: '#ffffff',
          borderColor: '#1f1f1f',
          borderWidth: 2,
          textAlign: 'left',
          textAlignVertical: 'top'
        }
      });
      createdItems.push(tableShape);
      idMap.set(tableObj.id, tableShape.id);
    }
  }

  // Import Shapes (First Pass: Normal Shapes and Images)
  if (elements.shapes) {
    for (const shapeObj of elements.shapes) {
      if (shapeObj.type === 'image') {
        try {
          const width = Math.max(shapeObj.width || 200, 10);
          const height = Math.max(shapeObj.height || 200, 10);
          
          let imgUrl = shapeObj.src;
          
          // Compress the image heavily to avoid Miro iframe postMessage size limits
          if (imgUrl && imgUrl.startsWith('data:image/')) {
            imgUrl = await new Promise<string>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                const MAX_DIM = 800;
                let w = img.width;
                let h = img.height;
                if (w > MAX_DIM || h > MAX_DIM) {
                  const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
                  w = Math.round(w * ratio);
                  h = Math.round(h * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, w, h);
                  resolve(canvas.toDataURL('image/jpeg', 0.6));
                } else {
                  reject('No context');
                }
              };
              img.onerror = reject;
              img.src = imgUrl;
            }).catch(err => {
              console.error("Compression failed", err);
              return shapeObj.src;
            });
          }

          const img = await miro.board.createImage({
            url: imgUrl,
            x: (shapeObj.left || 0) + width/2,
            y: (shapeObj.top || 0) + height/2,
            width: width
          });
          createdItems.push(img);
          idMap.set(shapeObj.id, img.id);
        } catch (e) {
          console.error("Failed to import image", e);
        }
      } else if (shapeObj.type !== 'line' && shapeObj.type !== 'arrow') {
        const shapeType = shapeObj.type === 'circle' ? 'circle' :
                          shapeObj.type === 'triangle' ? 'triangle' :
                          shapeObj.type === 'diamond' ? 'rhombus' : 'rectangle';
        
        let isDarkBg = false;
        const fillColor = hexToRgb(shapeObj.color || '#EFEFEF');
        if (fillColor.startsWith('#')) {
          let hex = fillColor.replace('#', '');
          if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
          if (hex.length === 6) {
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            if (yiq < 128) isDarkBg = true;
          }
        }

        const width = Math.max(shapeObj.width || 100, 10);
        const height = Math.max(shapeObj.height || 100, 10);
        const shape = await miro.board.createShape({
          shape: shapeType,
          content: shapeObj.text ? stripHtml(shapeObj.text) : '',
          x: (shapeObj.left || 0) + width/2,
          y: (shapeObj.top || 0) + height/2,
          width: width,
          height: height,
          style: {
            fillColor: fillColor,
            color: isDarkBg ? '#FFFFFF' : '#1F1F1F',
            borderColor: '#1F1F1F',
            borderWidth: shapeObj.strokeWidth ? parseInt(shapeObj.strokeWidth) : 2
          }
        });
        createdItems.push(shape);
        idMap.set(shapeObj.id, shape.id);
      }
    }
  }

  // Import Connectors (Second Pass: Lines/Arrows)
  if (elements.shapes) {
    for (const shapeObj of elements.shapes) {
      if (shapeObj.type === 'line' || shapeObj.type === 'arrow') {
        let startObj: any = { position: { x: shapeObj.left || 0, y: shapeObj.top || 0 } };
        let endObj: any = { position: { x: (shapeObj.left || 0) + (shapeObj.width || 100), y: (shapeObj.top || 0) + (shapeObj.height || 0) } };

        if (shapeObj.startNodeId && idMap.has(shapeObj.startNodeId)) {
          startObj = { item: idMap.get(shapeObj.startNodeId) };
          if (shapeObj.startAnchor) startObj.snapTo = shapeObj.startAnchor;
        }

        if (shapeObj.endNodeId && idMap.has(shapeObj.endNodeId)) {
          endObj = { item: idMap.get(shapeObj.endNodeId) };
          if (shapeObj.endAnchor) endObj.snapTo = shapeObj.endAnchor;
        }

        try {
          const connector = await miro.board.createConnector({
            start: startObj,
            end: endObj,
            style: {
              strokeColor: hexToRgb(shapeObj.color || '#1F1F1F'),
              strokeWidth: 3,
              startStrokeCap: 'none',
              endStrokeCap: shapeObj.type === 'arrow' ? 'arrow' : 'none'
            }
          });
          createdItems.push(connector);
        } catch (e) {
          console.error("Failed to create connector", e);
        }
      }
    }
  }


  // Import Drawings
  if (elements.drawings) {
    for (const stroke of elements.drawings) {
      if (stroke.d) {
        const sw = parseInt(stroke.width) || 3;
        const box = getPathBoundingBox(stroke.d, sw);
        
        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${box.w}" height="${box.h}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}">
  <path d="${stroke.d}" stroke="${stroke.color || '#1F1F1F'}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
        
        // Miro API requires base64 encoding for data URLs
        const b64 = btoa(unescape(encodeURIComponent(svgStr)));
        const dataUrl = 'data:image/svg+xml;base64,' + b64;
        
        try {
          const img = await miro.board.createImage({
            url: dataUrl,
            title: encodeURIComponent(JSON.stringify({ d: stroke.d, color: stroke.color || '#1F1F1F', width: sw })),
            x: box.x + box.w / 2, // Miro createImage positions from the center!
            y: box.y + box.h / 2,
            width: box.w
          });
          createdItems.push(img);
        } catch(e) {
          console.error("Failed to import drawing", e);
        }
      }
    }
  }

  if (createdItems.length > 0) {
    await miro.board.viewport.zoomTo(createdItems);
  }
}

// ==========================================
// EXPORT TO OMNIBOARD
// ==========================================

const exportBtn = document.getElementById('export-btn');
const exportStatusDiv = document.getElementById('export-status');

function setExportStatus(msg: string, color = '#1F1F1F') {
  if (exportStatusDiv) {
    exportStatusDiv.textContent = msg;
    exportStatusDiv.style.color = color;
  }
}

if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    try {
      exportBtn.style.opacity = '0.5';
      exportBtn.style.pointerEvents = 'none';
      setExportStatus(t('exporting'), '#1F1F1F');

      const items = await miro.board.get();
      
      const omniElements = {
        notes: [] as any[],
        shapes: [] as any[],
        texts: [] as any[],
        tasks: [] as any[],
        tables: [] as any[],
        drawings: [] as any[]
      };

      // We will map Miro IDs to Omniboard IDs to preserve connections
      const idMap = new Map<string, string>();

      for (const item of items) {
        const oId = 'omni_' + Math.random().toString(36).substr(2, 9);
        idMap.set(item.id, oId);
        const i = item as any;

        if (item.type === 'sticky_note') {
          omniElements.notes.push({
            id: oId,
            left: item.x - (item.width || 0) / 2,
            top: item.y - (item.height || 0) / 2,
            width: item.width,
            height: item.height,
            color: i.style?.fillColor === 'light_yellow' ? 'yellow' :
                   i.style?.fillColor === 'light_blue' ? 'blue' :
                   i.style?.fillColor === 'light_green' ? 'green' :
                   i.style?.fillColor === 'pink' ? 'pink' : 'yellow',
            tabs: [{
              id: 'tab_' + Math.random().toString(36).substr(2, 9),
              title: stripHtml(i.content || ''),
              content: i.content || ''
            }]
          });
        } else if (item.type === 'shape') {
          const sType = i.shape === 'circle' ? 'circle' :
                        i.shape === 'triangle' ? 'triangle' :
                        i.shape === 'rhombus' ? 'diamond' : 'rectangle';
          
          omniElements.shapes.push({
            id: oId,
            type: sType,
            left: item.x - (item.width || 0) / 2,
            top: item.y - (item.height || 0) / 2,
            width: item.width,
            height: item.height,
            color: i.style?.fillColor || '#EFEFEF',
            strokeWidth: i.style?.borderWidth || 2,
            text: i.content || ''
          });
        } else if (item.type === 'image') {
          // Check if this image is actually an Omniboard drawing
          if (i.title && i.title.includes('%22d%22')) {
            try {
              const drawingData = JSON.parse(decodeURIComponent(i.title));
              if (drawingData && drawingData.d) {
                omniElements.drawings.push({
                  id: oId,
                  d: drawingData.d,
                  color: drawingData.color || '#1F1F1F',
                  width: drawingData.width || 3
                });
              }
            } catch(e) {
              console.error('Failed to parse drawing data from image title', e);
            }
          } else {
            // It's a normal Miro image
            let base64Src = i.url || '';
            try {
              // Miro V2 SDK natively provides getDataUrl() on image items to get base64
              if (typeof (item as any).getDataUrl === 'function') {
                base64Src = await (item as any).getDataUrl();
              } else if (base64Src && base64Src.startsWith('http')) {
                // Fallback (might fail due to CORS)
                const resp = await fetch(base64Src);
                const blob = await resp.blob();
                base64Src = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = () => resolve(reader.result as string);
                });
              }
            } catch(e) {
              console.error('Failed to convert export image to base64', e);
            }

            omniElements.shapes.push({
              id: oId,
              type: 'image',
              left: item.x - (item.width || 0) / 2,
              top: item.y - (item.height || 0) / 2,
              width: item.width,
              height: item.height,
              src: base64Src
            });
          }
        } else if (item.type === 'text') {
          omniElements.texts.push({
            id: oId,
            left: item.x - (item.width || 0) / 2,
            top: item.y - (item.height || 0) / 2,
            width: item.width,
            height: item.height,
            content: i.content || '',
            color: i.style?.color || '#1F1F1F',
            fontSize: i.style?.fontSize || 16
          });
        }
      }

      // Pass 2: Connectors (need to know start/end node IDs)
      for (const item of items) {
        if (item.type === 'connector') {
          const i = item as any;
          const oId = 'omni_' + Math.random().toString(36).substr(2, 9);
          const startId = i.start?.item ? idMap.get(i.start.item) : null;
          const endId = i.end?.item ? idMap.get(i.end.item) : null;
          
          let left = 0;
          let top = 0;
          let width = 2;
          let height = 2;
          let dirX = 1;
          let dirY = 1;
          
          // If attached to an item, the position is relative. Ignore it and use the item's center.
          let startPos = i.start?.item ? null : i.start?.position;
          let endPos = i.end?.item ? null : i.end?.position;

          if (i.start?.item) {
             const sItem: any = items.find((it: any) => it.id === i.start.item);
             if (sItem) startPos = { x: sItem.x, y: sItem.y };
          }
          if (i.end?.item) {
             const eItem: any = items.find((it: any) => it.id === i.end.item);
             if (eItem) endPos = { x: eItem.x, y: eItem.y };
          }
          
          if (startPos && endPos) {
            left = Math.min(startPos.x, endPos.x);
            top = Math.min(startPos.y, endPos.y);
            width = Math.max(Math.abs(endPos.x - startPos.x), 2);
            height = Math.max(Math.abs(endPos.y - startPos.y), 2);
            dirX = endPos.x >= startPos.x ? 1 : -1;
            dirY = endPos.y >= startPos.y ? 1 : -1;
          } else if (startPos) {
            left = startPos.x;
            top = startPos.y;
          }

          omniElements.shapes.push({
            id: oId,
            type: i.style?.endStrokeCap === 'arrow' ? 'arrow' : 'line',
            left: left,
            top: top,
            width: width,
            height: height,
            dirX: dirX,
            dirY: dirY,
            color: i.style?.strokeColor || '#1F1F1F',
            startNodeId: startId,
            startAnchor: startId ? (i.start?.snapTo || 'right') : null,
            endNodeId: endId,
            endAnchor: endId ? (i.end?.snapTo || 'left') : null
          });
        }
      }

      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        elements: omniElements
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `omniboard_export_from_miro_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus(t('export_success'), '#43A047');
    } catch(err) {
      console.error(err);
      setExportStatus(t('export_failed'), '#E53935');
    } finally {
      exportBtn.style.opacity = '1';
      exportBtn.style.pointerEvents = 'auto';
      setTimeout(() => setExportStatus(''), 3000);
    }
  });
}
