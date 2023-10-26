const RFAppState = {
  data: {},
};

class RFTypography extends HTMLElement {
  static observedAttributes = ['variant', 'color'];

  constructor() {
    self = super();
  }

  getVariantClass() {
    const variant = self.getAttribute('variant');

    if (variant === 'title') {
      return 'typography-title';
    }

    if (variant === 'subtitle') {
      return 'typography-subtitle';
    }

    return 'typography-body';
  }

  getColorClass() {
    const color = self.getAttribute('color');

    if (color === 'invalid') {
      return 'color-invalid';
    }

    if (color === 'accent-text') {
      return 'color-accent-text';
    }

    if (color === 'brackets') {
      return 'color-brackets';
    }
    if (color === 'gray') {
      return 'color-gray';
    }

    return 'color-dark';
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(_name, _oldValue, _newValue) {
    this.render();
  }

  render() {
    const variantClass = this.getVariantClass();
    const colorClass = this.getColorClass();

    self.classList.add(variantClass);
    self.classList.add(colorClass);
  }
}

customElements.define('rf-typography', RFTypography);

class RFUploadButton extends HTMLElement {
  constructor() {
    self = super();
  }

  connectedCallback() {
    const mainContentSection = document.getElementById('mainContent');
    const viewerContentSection = document.getElementById('viewerContent');

    const text = self.textContent;
    self.innerHTML = '';

    const inputFile = document.createElement('input');
    const inputFileId = 'input-file-wrapper';
    inputFile.setAttribute('id', inputFileId);
    inputFile.setAttribute('type', 'file');
    inputFile.setAttribute('accept', 'application/json');
    inputFile.setAttribute('hidden', true);

    const button = document.createElement('button');
    button.setAttribute('class', 'rf-upload-button--default typography-body');
    button.textContent = text;

    button.addEventListener('click', () => {
      inputFile.click();
    });

    inputFile.addEventListener('change', async (event) => {
      const [file] = event.target.files;

      const fileReader = new FileReader();

      const readFileAsync = () => new Promise((resolve, reject) => {
        fileReader.onload = (e) => resolve(e.target.result);
        fileReader.onerror = (e) => reject(e);

        fileReader.readAsText(file);
      });

      const fileContent = await readFileAsync().catch((e) => console.error(e));

      const parseToObject = async (input) => {
        try {
          return {
            status: 'OK',
            result: JSON.parse(input),
          };
        } catch {
          return {
            status: 'ERROR',
            result: 'Invalid file. Please load a valid JSON file.',
          };
        }
      };

      const { status, result } = await parseToObject(fileContent);

      if (status === 'ERROR') {
        const invalidFileTypography = document.createElement('rf-typography');
        invalidFileTypography.classList.add('d-flex', 'pt-4');
        invalidFileTypography.setAttribute('color', 'invalid');
        invalidFileTypography.textContent = result;
        mainContentSection.appendChild(invalidFileTypography);

        return;
      }

      RFAppState.data = result;

      const fileNameTypography = document.createElement('rf-typography');
      fileNameTypography.classList.add('d-flex', 'pb-4');
      fileNameTypography.setAttribute('variant', 'subtitle');
      fileNameTypography.textContent = file.name;

      mainContentSection.classList.add('d-none');
      viewerContentSection.classList.remove('d-none');

      const jsonViewer = document.createElement('rf-json-viewer');
      jsonViewer.appendChild(fileNameTypography);
      viewerContentSection.appendChild(jsonViewer);
    });

    self.appendChild(inputFile);
    self.appendChild(button);
  }
}

customElements.define('rf-upload-button', RFUploadButton);

const delay = async (n) => await new Promise((resolve) => {
  console.log('[DELAYED]', n);
  setTimeout(() => {
    console.log('done');
    resolve();
  }, n);
});

class RFJSONViewer extends HTMLElement {

  constructor() {
    self = super();
  }

  connectedCallback() {
    const initialData = this.getDataInput();
    this.renderBy({ that: this }, initialData, true);
  }

  getDataInput() {
    if (!(RFAppState && RFAppState.data)) {
      return;
    }

    return RFAppState.data;
  }

  getSerializedPrimitiveValue(data) {
    if (data === null) {
      return 'null';
    }

    if (typeof data === 'string') {
      return data.length ? `"${data}"` : '""';
    }

    return data;
  }

  appendColonFragment(that, color) {
    const colonFragment = document.createElement('rf-typography');
    colonFragment.classList.add('pr-2');
    colonFragment.setAttribute('color', color);
    colonFragment.textContent = ':';
    that.appendChild(colonFragment);
  }

  renderBy(ref, data, n, root = false) {
    if (Array.isArray(data)) {
      const bracketLeftFragment = document.createElement('rf-typography');
      bracketLeftFragment.setAttribute('color', 'brackets');
      bracketLeftFragment.textContent = '[';
      (ref.node || ref.that).appendChild(bracketLeftFragment);

      const arrayFragment = document.createElement('ul');

      data.forEach((value, i) => {
        const itemFragment = document.createElement('span');
        itemFragment.classList.add('d-flex');

        const indexFragment = document.createElement('rf-typography');
        indexFragment.setAttribute('color', 'gray');
        indexFragment.textContent = i;
        itemFragment.appendChild(indexFragment);

        this.appendColonFragment(itemFragment, 'gray');
        arrayFragment.appendChild(itemFragment);
        this.renderBy({ that: arrayFragment, node: itemFragment }, value);
      });

      (ref.that).appendChild(arrayFragment);

      const bracketRightFragment = document.createElement('rf-typography');
      bracketRightFragment.setAttribute('color', 'brackets');
      bracketRightFragment.textContent = ']';
      ref.that.appendChild(bracketRightFragment);
      return;
    }

    if (data instanceof Object) {

      if (root) {
        Object.keys(data).forEach((key) => {
          const keyFragment = document.createElement('rf-typography');
          keyFragment.setAttribute('color', 'accent-text');
          keyFragment.textContent = key;
          ref.that.appendChild(keyFragment);
          this.appendColonFragment(ref.that, 'accent-text');
          this.renderBy(ref, data[key]);
        });

        return;
      }

      const objectFragment = document.createElement('ul');

      Object.keys(data).forEach((key) => {
        const itemFragment = document.createElement('span');
        itemFragment.classList.add('d-flex');

        const keyFragment = document.createElement('rf-typography');
        keyFragment.setAttribute('color', 'accent-text');
        keyFragment.textContent = key;
        itemFragment.appendChild(keyFragment);

        this.appendColonFragment(itemFragment, 'accent-text');
        objectFragment.appendChild(itemFragment);
        this.renderBy({ that: objectFragment, node: itemFragment}, data[key]);
      });

      ref.that.appendChild(objectFragment);

      return;
    }

    const valueFragment = document.createElement('rf-typography');
    valueFragment.setAttribute('color', 'dark');
    valueFragment.textContent = this.getSerializedPrimitiveValue(data);

    (ref.node || ref.that).appendChild(valueFragment);
  }
}

customElements.define('rf-json-viewer', RFJSONViewer);
