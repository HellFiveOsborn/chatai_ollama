const saveConfigBtn = document.getElementById('save-config');
const systemPrompt = document.getElementById('system-prompt');
const temperature = document.getElementById('temperature');
const numPredict = document.getElementById('num-predict');
const topK = document.getElementById('top-k');
const topP = document.getElementById('top-p');

const loadConfig = () => {
  let config = JSON.parse(localStorage.getItem('config')) 
  
  if (!config) {
    config = {
        system: 'Please respond to user inquiries in a friendly and empathetic manner, while maintaining a professional tone. Use positive language and offer helpful solutions to their problems.',
        options: {
          temperature: 0.7,
          num_predict: 2048,
          top_k: 40,
          top_p: 0.9,
        }
    };
    localStorage.setItem('config', JSON.stringify(config));
  }

  systemPrompt.value = config.system;
  temperature.value = config.options.temperature;
  numPredict.value = config.options.num_predict;
  topK.value = config.options.top_k;
  topP.value = config.options.top_p;

  document.getElementById('temperature-value').textContent = config.options.temperature;
  document.getElementById('top-p-value').textContent = config.options.top_p;
};

const saveConfig = () => {
  const config = {
    system: systemPrompt.value,
    options: {
      temperature: parseFloat(temperature.value),
      num_predict: parseInt(numPredict.value),
      top_k: parseInt(topK.value),
      top_p: parseFloat(topP.value),
    },
  };

  localStorage.setItem('config', JSON.stringify(config));
  configModal.classList.add('hidden');
  powAlert({ 
    color: 'info', 
    title: 'Settings Saved!', 
    text: 'Settings saved successfully<br>Update page!', 
    html: true,
    position: 'topRight' 
  });
};

saveConfigBtn.addEventListener('click', saveConfig);

document.addEventListener('DOMContentLoaded', loadConfig);

document.getElementById('temperature').addEventListener('input', function() {
    var temperatureValue = this.value;
    document.getElementById('temperature-value').textContent = temperatureValue;
});

document.getElementById('top-p').addEventListener('input', function() {
    var topPValue = this.value;
    document.getElementById('top-p-value').textContent = topPValue;
});