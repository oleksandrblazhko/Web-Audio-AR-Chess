import { Point } from '../models/Point.js';

export class BoardStateManager {
    constructor() {
        this.boardState = new Map();           // cell ("e4") → pieceInfo
        this.markerToCell = new Map();         // markerId → cell ("e4")
        this.orientation = "white";            // "white" або "black"
        this.moveHistory = [];                 // історія підтверджених ходів
        this.currentTurn = "white";
        
        // Налаштування стабільності
        this.hysteresisThreshold = 0.45;       // Відстань від центру клітинки (0-0.5)
        this.moveConfirmationTime = 300;        // мс для підтвердження ходу
        this.maxMoveHistory = 1000;             // максимальна кількість ходів в історії
        
        // Внутрішні структури для стабілізації
        this.pendingMoves = new Map();          // markerId → {from, to, timestamp}
        this.markerStability = new Map();       // markerId → {cell, confidence, lastUpdate}
    }
    
    /**
     * Оновлення позиції маркера з гістерезисом
     */
    updateMarkerPosition(markerId, gridX, gridY, markerData = {}) {
        try {
            const cell = this.gridToCell(gridX, gridY);
            if (!cell) return null;
            
            const previousCell = this.markerToCell.get(markerId);
            const now = Date.now();
            
            // Якщо маркер вже на цій клітинці - просто оновлюємо
            if (previousCell === cell) {
                const pieceInfo = this.boardState.get(cell);
                if (pieceInfo) {
                    pieceInfo.lastSeen = now;
                    pieceInfo.gridX = Math.floor(gridX);
                    pieceInfo.gridY = Math.floor(gridY);
                    
                    // Підвищуємо впевненість
                    const stability = this.markerStability.get(markerId) || { confidence: 0 };
                    stability.cell = cell;
                    stability.confidence = Math.min(stability.confidence + 0.2, 1.0);
                    stability.lastUpdate = now;
                    this.markerStability.set(markerId, stability);
                }
                return pieceInfo || null;
            }
            
            // Перевіряємо, чи маркер достатньо вглиб нової клітинки
            const cellCenter = this.cellToGrid(cell);
            if (cellCenter) {
                const distanceFromCenter = Math.sqrt(
                    Math.pow(gridX - (cellCenter.x + 0.5), 2) + 
                    Math.pow(gridY - (cellCenter.y + 0.5), 2)
                );
                
                // Якщо маркер на межі клітинок - залишаємо на попередній
                if (distanceFromCenter > this.hysteresisThreshold) {
                    // Оновлюємо lastSeen для попередньої клітинки
                    if (previousCell) {
                        const pieceInfo = this.boardState.get(previousCell);
                        if (pieceInfo) {
                            pieceInfo.lastSeen = now;
                        }
                    }
                    return previousCell ? this.boardState.get(previousCell) : null;
                }
            }
            
            // Маркер стабільно в новій клітинці
            // Перевіряємо, чи потрібне підтвердження ходу
            if (previousCell && previousCell !== cell) {
                const pendingMove = this.pendingMoves.get(markerId);
                
                if (!pendingMove || pendingMove.to !== cell) {
                    // Нова потенційна зміна позиції
                    this.pendingMoves.set(markerId, {
                        from: previousCell,
                        to: cell,
                        timestamp: now
                    });
                    
                    // Залишаємо маркер на попередній клітинці до підтвердження
                    const pieceInfo = this.boardState.get(previousCell);
                    if (pieceInfo) {
                        pieceInfo.lastSeen = now;
                    }
                    return pieceInfo || null;
                } else if (now - pendingMove.timestamp < this.moveConfirmationTime) {
                    // Хід ще не підтверджено
                    const pieceInfo = this.boardState.get(previousCell);
                    if (pieceInfo) {
                        pieceInfo.lastSeen = now;
                    }
                    return pieceInfo || null;
                } else {
                    // Хід підтверджено - виконуємо переміщення
                    this.pendingMoves.delete(markerId);
                    return this._executeMove(markerId, previousCell, cell, gridX, gridY, markerData);
                }
            }
            
            // Перша поява маркера або переміщення без попередньої позиції
            return this._executeMove(markerId, previousCell, cell, gridX, gridY, markerData);
            
        } catch (error) {
            console.error("Error in updateMarkerPosition:", error);
            return null;
        }
    }
    
    /**
     * Виконання підтвердженого ходу
     */
    _executeMove(markerId, fromCell, toCell, gridX, gridY, markerData) {
        const now = Date.now();
        
        const pieceInfo = {
            markerId,
            cell: toCell,
            gridX: Math.floor(gridX),
            gridY: Math.floor(gridY),
            type: markerData.obj_type || "unknown",
            color: markerData.color || null,
            audioName: markerData.audio_name || null,
            markerHeight: markerData.marker_height || 0,
            name: markerData.name || null,
            lastSeen: now
        };
        
        // Додаємо хід в історію
        if (fromCell && fromCell !== toCell) {
            this.moveHistory.push({
                markerId,
                from: fromCell,
                to: toCell,
                timestamp: now,
                pieceType: pieceInfo.type,
                color: pieceInfo.color,
                name: pieceInfo.name
            });
            
            // Обмежуємо історію
            if (this.moveHistory.length > this.maxMoveHistory) {
                this.moveHistory.shift();
            }
        }
        
        // Оновлюємо стан
        this.boardState.set(toCell, pieceInfo);
        this.markerToCell.set(markerId, toCell);
        
        // Видаляємо стару позицію
        if (fromCell && fromCell !== toCell) {
            this.boardState.delete(fromCell);
        }
        
        // Оновлюємо стабільність
        this.markerStability.set(markerId, {
            cell: toCell,
            confidence: 1.0,
            lastUpdate: now
        });
        
        return pieceInfo;
    }
    
    /**
     * Конвертація координат сітки в шахову нотацію
     */
    gridToCell(gridX, gridY) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        
        // Перевірка на валідність вхідних даних
        if (typeof gridX !== 'number' || typeof gridY !== 'number' || 
            isNaN(gridX) || isNaN(gridY) || !isFinite(gridX) || !isFinite(gridY)) {
            return null;
        }
        
        const floorX = Math.floor(gridX);
        const floorY = Math.floor(gridY);
        
        if (floorX < 0 || floorX > 7 || floorY < 0 || floorY > 7) {
            return null;
        }
        
        let fileIndex, rankIndex;
        
        if (this.orientation === "white") {
            fileIndex = floorX;
            rankIndex = 7 - floorY;
        } else {
            fileIndex = 7 - floorX;
            rankIndex = floorY;
        }
        
        return files[fileIndex] + (rankIndex + 1);
    }
    
    /**
     * Конвертація шахової нотації в координати сітки
     */
    cellToGrid(cell) {
        if (!cell || typeof cell !== 'string' || cell.length < 2) {
            return null;
        }
        
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const file = cell[0].toLowerCase();
        const rank = parseInt(cell[1]);
        
        if (isNaN(rank) || rank < 1 || rank > 8) {
            return null;
        }
        
        const fileIndex = files.indexOf(file);
        if (fileIndex === -1) {
            return null;
        }
        
        let gridX, gridY;
        
        if (this.orientation === "white") {
            gridX = fileIndex;
            gridY = 7 - (rank - 1);
        } else {
            gridX = 7 - fileIndex;
            gridY = rank - 1;
        }
        
        return { x: gridX, y: gridY };
    }
    
    /**
     * Отримання фігури на клітинці
     */
    getPieceAt(cell) {
        return this.boardState.get(cell) || null;
    }
    
    /**
     * Отримання клітинки за ID маркера
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
            this.pendingMoves.delete(markerId);
            this.markerStability.delete(markerId);
            return true;
        }
        return false;
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
     * Генерація FEN-рядка
     */
    getFEN() {
        try {
            if (this.boardState.size === 0) {
                return "8/8/8/8/8/8/8/8 w";
            }
            
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
                        const pieceChar = piece.type ? piece.type[0].toUpperCase() : '?';
                        fen += pieceChar;
                    } else {
                        emptyCount++;
                    }
                }
                if (emptyCount > 0) fen += emptyCount;
                if (rank > 1) fen += '/';
            }
            
            fen += ' ' + (this.currentTurn === "white" ? 'w' : 'b');
            return fen;
        } catch (error) {
            console.error("Error generating FEN:", error);
            return "8/8/8/8/8/8/8/8 w";
        }
    }
    
    /**
     * Отримання історії ходів
     */
    getMoveHistory() {
        return this.moveHistory;
    }
    
    /**
     * Отримання останнього ходу
     */
    getLastMove() {
        return this.moveHistory.length > 0 
            ? this.moveHistory[this.moveHistory.length - 1] 
            : null;
    }
    
    /**
     * Зміна орієнтації дошки
     */
    setOrientation(orientation) {
        if (orientation === "white" || orientation === "black") {
            this.orientation = orientation;
            return true;
        }
        return false;
    }
    
    /**
     * Очищення стану
     */
    clear() {
        this.boardState.clear();
        this.markerToCell.clear();
        this.moveHistory = [];
        this.pendingMoves.clear();
        this.markerStability.clear();
    }
    
    /**
     * Отримання стану для відлагодження
     */
    getDebugInfo() {
        return {
            pieces: this.boardState.size,
            markers: this.markerToCell.size,
            moves: this.moveHistory.length,
            pendingMoves: this.pendingMoves.size,
            orientation: this.orientation
        };
    }
}
