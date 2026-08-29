import { Point } from '../models/Point.js';

export class BoardStateManager {
    constructor() {
        this.boardState = new Map();
        this.markerToCell = new Map();
        this.orientation = "white";
        this.moveHistory = [];
        this.currentTurn = "white";
    }
    
    updateMarkerPosition(markerId, gridX, gridY, markerData = {}) {
        try {
            const cell = this.gridToCell(gridX, gridY);
            
            if (!cell) return null;
            
            const pieceInfo = {
                markerId,
                cell,
                gridX,
                gridY,
                type: markerData.obj_type || "unknown",
                color: markerData.color || null,
                audioName: markerData.audio_name || null,
                markerHeight: markerData.marker_height || 0,
                name: markerData.name || null,
                lastSeen: Date.now()
            };
            
            const previousCell = this.markerToCell.get(markerId);
            if (previousCell && previousCell !== cell) {
                this.moveHistory.push({
                    markerId,
                    from: previousCell,
                    to: cell,
                    timestamp: Date.now(),
                    pieceType: pieceInfo.type,
                    color: pieceInfo.color
                });
                
                // Обмежуємо історію до 1000 ходів
                if (this.moveHistory.length > 1000) {
                    this.moveHistory.shift();
                }
            }
            
            this.boardState.set(cell, pieceInfo);
            this.markerToCell.set(markerId, cell);
            
            if (previousCell && previousCell !== cell) {
                this.boardState.delete(previousCell);
            }
            
            return pieceInfo;
        } catch (error) {
            console.error("Error in updateMarkerPosition:", error);
            return null;
        }
    }
    
    gridToCell(gridX, gridY) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        
        // Перевірка на валідність вхідних даних
        if (typeof gridX !== 'number' || typeof gridY !== 'number' || 
            isNaN(gridX) || isNaN(gridY)) {
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
    
    getPieceAt(cell) {
        return this.boardState.get(cell) || null;
    }
    
    getMarkerCell(markerId) {
        return this.markerToCell.get(markerId) || null;
    }
    
    removeMarker(markerId) {
        const cell = this.markerToCell.get(markerId);
        if (cell) {
            this.boardState.delete(cell);
            this.markerToCell.delete(markerId);
            return true;
        }
        return false;
    }
    
    isCellOccupied(cell) {
        return this.boardState.has(cell);
    }
    
    getAllPieces() {
        return Array.from(this.boardState.values());
    }
    
    getFEN() {
        try {
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
                        // Використовуємо безпечний доступ до типу
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
            return "Error generating FEN";
        }
    }
    
    clear() {
        this.boardState.clear();
        this.markerToCell.clear();
        this.moveHistory = [];
    }
}
