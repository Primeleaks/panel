import { createApp, h } from 'vue';
import ToastNotification from '../components/ToastNotification.vue';

class ToastService {
  constructor() {
    this.toasts = [];
    this.toastContainer = null;
    this.createToastContainer();
  }

  createToastContainer() {
    // Create toast container if it doesn't exist
    if (!this.toastContainer) {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
      this.toastContainer = container;

      // Add styles to container
      const style = document.createElement('style');
      style.innerHTML = `
        .toast-container {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .toast-container.top-right {
          top: 20px;
          right: 20px;
        }
        .toast-container.top-left {
          top: 20px;
          left: 20px;
        }
        .toast-container.top-center {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
        .toast-container.bottom-right {
          bottom: 20px;
          right: 20px;
        }
        .toast-container.bottom-left {
          bottom: 20px;
          left: 20px;
        }
        .toast-container.bottom-center {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
      `;
      document.head.appendChild(style);
    }
  }

  updateContainerPosition(position) {
    // Remove all position classes
    this.toastContainer.classList.remove(
      'top-right', 'top-left', 'top-center', 
      'bottom-right', 'bottom-left', 'bottom-center'
    );
    
    // Add current position class
    this.toastContainer.classList.add(position);
  }

  show(options) {
    const defaults = {
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      dismissible: true,
      position: 'top-right',
      progressBar: true
    };

    const toastOptions = { ...defaults, ...options };
    
    // Update container position if needed
    this.updateContainerPosition(toastOptions.position);
    
    // Create a div for mounting the toast
    const toastDiv = document.createElement('div');
    this.toastContainer.appendChild(toastDiv);
    
    // Create and mount the toast component
    const toastApp = createApp({
      render() {
        return h(ToastNotification, {
          ...toastOptions,
          onClose: () => {
            // Remove the toast after animation
            setTimeout(() => {
              if (toastDiv.parentNode) {
                this.toastContainer.removeChild(toastDiv);
              }
              toastApp.unmount();
              
              const index = this.toasts.findIndex(t => t.id === toast.id);
              if (index !== -1) {
                this.toasts.splice(index, 1);
              }
            }, 300);
          }
        });
      }
    });
    
    // Generate unique id
    const toast = {
      id: Date.now().toString(),
      app: toastApp,
      element: toastDiv
    };
    
    this.toasts.push(toast);
    toastApp.mount(toastDiv);
    
    return toast.id;
  }

  // Helper methods for different toast types
  success(options) {
    return this.show({ ...options, type: 'success' });
  }
  
  error(options) {
    return this.show({ ...options, type: 'error' });
  }
  
  warning(options) {
    return this.show({ ...options, type: 'warning' });
  }
  
  info(options) {
    return this.show({ ...options, type: 'info' });
  }
  
  // Close a specific toast by id
  close(id) {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      // Trigger the close method on the toast component
      const toastComponent = toast.app._instance.refs.toast;
      if (toastComponent && toastComponent.close) {
        toastComponent.close();
      }
    }
  }
  
  // Close all toasts
  closeAll() {
    this.toasts.forEach(toast => {
      this.close(toast.id);
    });
  }
}

// Create a singleton instance
const toastService = new ToastService();

export default toastService;
