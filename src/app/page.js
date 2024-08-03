'use client'

import React, { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore, storage } from '@/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'
import ImageUploading from 'react-images-uploading'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [images, setImages] = useState([])
  const maxNumber = 69

  const handleImageChange = (imageList, addUpdateIndex) => {
    setImages(imageList)
  }

  const uploadImageToFirebase = async (file) => {
    const storageRef = ref(storage, `images/${file.name}`)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (images.length === 0) return
    const imageUrl = await uploadImageToFirebase(images[0].file)
    console.log('Uploaded image URL:', imageUrl)
    // Call your image analysis API here with imageUrl
  }

  const updateInventory = async () => {
    try {
      const snapshot = query(collection(firestore, 'inventory'))
      const docs = await getDocs(snapshot)
      const inventoryList = []
      docs.forEach((doc) => {
        inventoryList.push({ name: doc.id, ...doc.data() })
      })
      setInventory(inventoryList)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const addItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const { quantity } = docSnap.data()
        await setDoc(docRef, { quantity: quantity + 1 })
      } else {
        await setDoc(docRef, { quantity: 1 })
      }
      await updateInventory()
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const { quantity } = docSnap.data()
        if (quantity === 1) {
          await deleteDoc(docRef)
        } else {
          await setDoc(docRef, { quantity: quantity - 1 })
        }
      }
      await updateInventory()
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <main className="container mt-6 mx-auto px-4 max-w-2xl flex flex-col gap-4">
        <h1 className="text-4xl font-bold">GPT-4 Image Analyzer</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <ImageUploading
            multiple
            value={images}
            onChange={handleImageChange}
            maxNumber={maxNumber}
            dataURLKey="data_url"
          >
            {({
              imageList,
              onImageUpload,
              onImageRemoveAll,
              onImageUpdate,
              onImageRemove,
              isDragging,
              dragProps,
            }) => (
              <div className="upload__image-wrapper">
                <button
                  style={isDragging ? { color: 'red' } : undefined}
                  onClick={onImageUpload}
                  {...dragProps}
                >
                  Click or Drop here
                </button>
                &nbsp;
                <button onClick={onImageRemoveAll}>Remove all images</button>
                {imageList.map((image, index) => (
                  <div key={index} className="image-item">
                    <img src={image['data_url']} alt="" width="100" />
                    <div className="image-item__btn-wrapper">
                      <button onClick={() => onImageUpdate(index)}>Update</button>
                      <button onClick={() => onImageRemove(index)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ImageUploading>
          <button className="uppercase py-2 px-2 rounded-xl bg-lime-700 text-white">
            Analyze
          </button>
        </form>
      </main>

      <Box
        width="100vw"
        height="100vh"
        display="flex"
        justifyContent="center"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add Item
            </Typography>
            <Stack width="0%" direction="row" spacing={2}>
              <TextField
                id="outlined-basic"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  addItem(itemName)
                  setItemName('')
                  handleClose()
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Button variant="contained" onClick={handleOpen}>
          Add New Item
        </Button>
        <TextField
          width="800px"

          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />
        <Box border="1px solid #333">
          <Box
            width="800px"
            height="100px"
            bgcolor="#ADD8E6"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Typography variant="h2" color="#333" textAlign="center">
              Inventory Items
            </Typography>
          </Box>
          <Stack width="800px" height="300px" spacing={2} overflow="auto">
            {filteredInventory.map(({ name, quantity }) => (
              <Box
                key={name}
                width="100%"
                minHeight="150px"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                bgcolor="#f0f0f0"
                paddingX={5}
              >
                <Typography variant="h3" color="#333" textAlign="center">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant="h3" color="#333" textAlign="center">
                  Quantity: {quantity}
                </Typography>
                <Button variant="contained" onClick={() => removeItem(name)}>
                  Remove
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  )
}
