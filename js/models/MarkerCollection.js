export class MarkerCollection {

    constructor() {

        this.markers = [];

    }

    clear() {

        this.markers.length = 0;

    }

    add(marker) {

        this.markers.push(marker);

    }

    get size() {

        return this.markers.length;

    }

}
