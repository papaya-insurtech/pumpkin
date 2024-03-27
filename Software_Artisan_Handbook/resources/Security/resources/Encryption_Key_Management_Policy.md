# Encryption Key Management Policy

## Control the use of cryptographic controls and keys

This policy defines the controls and related procedures for the various areas where encryption and other cryptographic techniques are employed.

### Scope and application

Cryptographic controls can be used to achieve different information security objectives, e.g.:

- Confidentiality: using encryption of information to protect sensitive or critical information, either stored or transmitted
- Integrity/authenticity: using digital signature certificates or message authentication codes to verify authenticity or integrity of stored or transmitted sensitive or critical information
- Non-repudiation: using cryptographic techniques to provide evidence of the occurrence of an event or action
- Authentication: using cryptographic techniques to authenticate users and other system entities requesting access or transacting with system users,entities and resources

### Definitions

- Cryptography: a method of storing and transmitting data in a form that only those it is intended for can read and process.
- Encryption: the process of converting data from plain text to a form that is not readable to unauthorized parties, known as cipher-text.
- Key: the input that controls the process of encryption and decryption.There are both secret and public keys used in cryptography.
- Digital Certificate: An electronic document that is used to verify the identity of the certificate holder when conducting electronic transactions. SSL certificates are a common example that have identifying data about a server on the Internet as well as the owning authority’s public encryption key.
- Digital Signature Certificate: a type of digital certificate that proves that the sender of a message or owner of a document is authentic and the integrity of the message or document is intact. A digital signature certificate uses asymmetric cryptography and is not a scanned version of someone’s handwritten signature or a computer-generated handwritten signature (a.k.a. an electronic signature).
- SSH Keys: A public/private key pair used for authenticating to SSH servers and establishing a secure network connection.

### Use of cryptographic controls policy

Approved encryption methods for data at rest

- The Data Handling Procedures require that the storage of sensitive data in some locations be encrypted. Refer to the Data Handling Procedures for specific requirements.
- Refer to the Procedures for Encrypting Data for approved encryption methods and key management procedures.
Encryption methods for data in motion
- The Data Handling Procedures require the transfer of sensitive data through a secure channel. A secure channel is an encrypted network connection.
- Various methods of encryption are available and generally built-into the application. The user should be aware of the data connection being used to transmit sensitive data and if encryption is enabled for that connection.
- Encryption is required for
    1. The transport of sensitive files (SSL or SCP usage to encrypt sensitive data for network file access of unencrypted files).
    2. Access to sensitive data via a web site, web application or mobile app. Encryption is required for accessing sensitive data from anything with a web interface, including mobile devices (i.e. use of HTTPS to encrypt sensitive data).
    3. All network traffic for remote access to the virtual desktop environment; i.e. Region Midt Citrix usage
    4. Transport of sensitive data that is part of a database query or web service call (examples SQL query to retrieve or send data from database or a web service call to retrieve or send data from a cloud application).
    5. Privileged access to network or server equipment for system management purposes; i.e. SSH

Encryption of Email

- The Data Handling Procedures require forbids emailing sensitive data, which has to be exchanged through the YASWA file-sharing functionality in the Misc-menu.

Use and management of SSH keys  

- Create a key-pair by running: ssh-keygen -t rsa -C "<your_email@scandiatx.org>"

Use and management of SSL digital certificates

- SCTP web servers (or devices with a web interface) that support secure (HTTPS) connections must have a SSL certificate installed.
- Certificate management procedures.

## Cryptographic key policy

Encryption Key Management, if not done properly, can lead to compromise and disclosure of private keys use to secure sensitive data and hence, compromise of the data. While users may understand it’s important to encryption certain documents and electronic communications, they may not be familiar with minimum standards for protection encryption keys.

### Purpose

This policy outlines the requirements for protecting encryption keys that are under the control of end users. These requirements are designed to prevent unauthorized disclosure and subsequent fraudulent use. The protection methods outlined will include operational and technical controls,such as key backup procedures, encryption under a separate key and use of tamper-resistant hardware.

### Policy

All encryption keys covered by this policy must be protected to prevent their unauthorized disclosure and subsequent fraudulent use.

#### Secret Key Encryption Keys

Keys used for secret key encryption, also called symmetric cryptography, must be protected as they are distributed to all parties that will use them. During distribution, the symmetric encryption keys must be encrypted using an RSA key of at least 2048 bits. This is implemented using standard openssl libraries when using both SSH and HTTPS, which ensures proper key-exchange and storage.

#### Public Key Encryption Keys

Public key cryptography, or asymmetric cryptography, uses public-private key pairs. The public key is passed to the certificate authority to be included in the digital certificate issued to the end user. The digital certificate is available to everyone once it issued. The private key should only be available to the end user to whom the corresponding digital certificate is issued.

#### Loss and Theft

The loss, theft, or potential unauthorized disclosure of any encryption key covered by this policy must be reported immediately to the current staff, which must then apply proper actions that will be required regarding revocation of certificates or public-private key pairs.
