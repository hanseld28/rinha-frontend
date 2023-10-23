class RFTypography extends HTMLElement {
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

  connectedCallback() {
    const variantClass = this.getVariantClass();

    self.setAttribute('class', variantClass);
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

      const fileContent = await readFileAsync().catch((e) => console.log(e));

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
        console.error(result);
        return;
      }

      mainContentSection.classList.add('d-none');
      viewerContentSection.classList.add('d-block');
      
      window.RF_APP_STATE = {
        data: result,
      };

      const jsonViewer = document.createElement('rf-json-viewer');
      viewerContentSection.appendChild(jsonViewer);
    });

    self.appendChild(inputFile);
    self.appendChild(button);
  }
}

customElements.define('rf-upload-button', RFUploadButton);

class RFJSONViewer extends HTMLElement {

  constructor() {
    self = super();
  }

  connectedCallback() {
    if (!(RF_APP_STATE && RF_APP_STATE.data)) {
      return;
    }

    const { data } = RF_APP_STATE;

    console.log('RESULT_OBJECT', data);
  }
}

customElements.define('rf-json-viewer', RFJSONViewer);
