export class BoardStateManager {
    constructor() {
        // Карта: клітинка ("e4") → інформація про фігуру
        this.boardState = new Map();
        
        // Карта: markerId → клітинка ("e4")
        this.markerToCell = new Map();
        
        // Орієнтація дошки: "white" або "black"
        this.orientation = "white";
        
        // Історія ходів
        this.moveHistory = [];
        
        // Поточний хід (white/black)
        this.currentTurn = "white";
    }
    
    /**
     * Оновлення позиції маркера на дошці
     * @param {string} markerId - ID маркера
     * @param {number} gridX - координата X в сітці (0-7)
     * @param {number} gridY - координата Y в сітці (0-7)
     * @param {object} markerData - дані з objectsData[markerId]
     */
    updateMarkerPosition(markerId, gridX, gridY, markerData = {}) {
        const cell = this.gridToCell(gridX, gridY);
        
        if (!cell) return null; // Маркер поза дошкою
        
        const pieceInfo = {
            markerId,
            cell,
            gridX,
            gridY,
            type: markerData.obj_type || "unknown",
            color: markerData.color || null,
            audioName: markerData.audio_name || null,
            markerHeight: markerData.marker_height || 0,
            lastSeen: Date.now()
        };
        
        // Перевіряємо, чи був маркер на іншій клітинці
        const previousCell = this.markerToCell.get(markerId);
        if (previousCell && previousCell !== cell) {
            // Фігура перемістилася - записуємо хід
            this.moveHistory.push({
                markerId,
                from: previousCell,
                to: cell,
                timestamp: Date.now(),
                pieceType: pieceInfo.type,
                color: pieceInfo.color
            });
        }
        
        // Оновлюємо стан
        this.boardState.set(cell, pieceInfo);
        this.markerToCell.set(markerId, cell);
        
        // Видаляємо стару позицію
        if (previousCell && previousCell !== cell) {
            this.boardState.delete(previousCell);
        }
        
        return pieceInfo;
    }
    
    /**
     * Конвертація координат сітки в шахову нотацію
     */
    gridToCell(gridX, gridY) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        
        if (gridX < 0 || gridX > 7 || gridY < 0 || gridY > 7) {
            return null;
        }
        
        let fileIndex, rankIndex;
        
        if (this.orientation === "white") {
            // Для білих: a1 - лівий нижній кут
            fileIndex = Math.floor(gridX);
            rankIndex = 7 - Math.floor(gridY);
        } else {
            // Для чорних: a1 - правий верхній кут
            fileIndex = 7 - Math.floor(gridX);
            rankIndex = Math.floor(gridY);
        }
        
        return files[fileIndex] + (rankIndex + 1);
    }
    
    /**
     * Отримання фігури на клітинці
     */
    getPieceAt(cell) {
        return this.boardState.get(cell) || null;
    }
    
    /**
     * Отримання позиції маркера
     */
    getMarkerCell(markerId) {
        return this.markerToCell.get(markerId) || null;
    }
    
    /**
     * Видалення маркера з дошки
     */
    removeMarker(markerId) {
        const cell = this.markerToCell.get(markerId);
        if (cell) {
            this.boardState.delete(cell);
            this.markerToCell.delete(markerId);
        }
    }
    
    /**
     * Перевірка, чи клітинка зайнята
     */
    isCellOccupied(cell) {
        return this.boardState.has(cell);
    }
    
    /**
     * Отримання всіх фігур на дошці
     */
    getAllPieces() {
        return Array.from(this.boardState.values());
    }
    
    /**
     * Отримання стану дошки у форматі FEN (спрощений)
     */
    getFEN() {
        let fen = '';
        for (let rank = 8; rank >= 1; rank--) {
            let emptyCount = 0;
            for (let file = 0; file < 8; file++) {
                const cell = 'abcdefgh'[file] + rank;
                const piece = this.boardState.get(cell);
                
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += piece.type[0].toUpperCase(); // Перша літера типу фігури
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (rank > 1) fen += '/';
        }
        fen += ' ' + this.currentTurn[0]; // w або b
        return fen;
    }
    
    /**
     * Очищення стану
     */
    clear() {
        this.boardState.clear();
        this.markerToCell.clear();
        this.moveHistory = [];
    }
}
