export const suggestEmailTypo = (email) => {
  if (!email || !email.includes('@')) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1].toLowerCase();
  
  const commonDomains = {
    'gmail.com': ['gmail.con', 'gmail.comm', 'gmial.com', 'gmai.com', 'gamil.com', 'gmail.co'],
    'yahoo.com': ['yahoo.con', 'yaho.com', 'yahoo.comm', 'yahoo.co'],
    'hotmail.com': ['hotnail.com', 'hotmail.con', 'hotmal.com', 'hotmail.co'],
    'outlook.com': ['outlok.com', 'outlook.con', 'outlook.co'],
    'icloud.com': ['iclud.com', 'icloud.con', 'icoud.com', 'icloud.co']
  };

  for (const [correct, typos] of Object.entries(commonDomains)) {
    if (typos.includes(domain)) {
      return `Did you mean ${correct}?`;
    }
  }
  
  return null;
};
